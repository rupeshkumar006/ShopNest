<?php
header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt_helper.php';
require_once __DIR__ . '/../config/razorpay.php';
require_once __DIR__ . '/../utils/send_email.php';
require_once __DIR__ . '/../config/encryption.php';
require_once __DIR__ . '/../utils/send_confirmation_email.php';
$pdo->exec("SET time_zone = '+05:30'");

$data = json_decode(file_get_contents('php://input'), true);

// Add debug log for incoming payload
file_put_contents(__DIR__ . '/debug_confirm_payment.log', json_encode($data) . PHP_EOL, FILE_APPEND);

$razorpay_payment_id = $data['razorpay_payment_id'] ?? '';
$razorpay_order_id = $data['razorpay_order_id'] ?? '';
$razorpay_signature = $data['razorpay_signature'] ?? '';

// At the top, clarify error message for missing payment details
if (empty($razorpay_payment_id) || empty($razorpay_order_id) || empty($razorpay_signature)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing payment details in request.']);
    exit;
}

// Razorpay signature verification
$generated_signature = hash_hmac('sha256', $razorpay_order_id . "|" . $razorpay_payment_id, RAZORPAY_SECRET);
if (!hash_equals($generated_signature, $razorpay_signature)) {
    echo json_encode(['success' => false, 'error' => ['message' => 'Payment verification failed😥']]);
    exit;
}

// Start a transaction to ensure all or nothing is saved
$pdo->beginTransaction();
try {
    // Step 1: Fetch the order using razorpay_order_id
    $max_retries = 5;
    $retry_delay = 200000; // 200ms
    $order = null;
    for ($attempt = 0; $attempt < $max_retries; $attempt++) {
    // Debug log for searched value
    file_put_contents(__DIR__ . '/debug_confirm_payment.log', '[LOOKUP_ATTEMPT] ' . json_encode(['search' => $razorpay_order_id]) . PHP_EOL, FILE_APPEND);
    $stmt = $pdo->prepare("SELECT o.id, o.user_id, o.name, o.shipping_address, o.billing_address, o.total_amount, u.email as user_email, o.guest_email, o.razorpay_order_id, o.coupon_code FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE TRIM(LOWER(o.razorpay_order_id)) = TRIM(LOWER(?))");
    $stmt->execute([strtolower(trim($razorpay_order_id))]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    // Debug log for DB value
    file_put_contents(__DIR__ . '/debug_confirm_payment.log', '[LOOKUP_RESULT] ' . json_encode(['db_razorpay_order_id' => $order['razorpay_order_id'] ?? null, 'order' => $order]) . PHP_EOL, FILE_APPEND);
        if ($order) break;
        usleep($retry_delay);
    }
    if (!$order) {
        error_log("[confirm_payment] Order not found after retries for razorpay_order_id $razorpay_order_id");
        throw new Exception("Order not found after payment. Please contact support.");
    }
    $order_id = $order['id'];
    $user_id = $order['user_id'];

    // Step 2: Update the main order to "paid" using the primary key
    $stmt = $pdo->prepare("UPDATE orders SET status = 'paid', payment_id = ?, signature = ? WHERE id = ?");
    $stmt->execute([$razorpay_payment_id, $razorpay_signature, $order_id]);
    // Robust error handling for update
    if ($stmt->rowCount() === 0) {
        file_put_contents(__DIR__ . '/debug_confirm_payment.log', '[UPDATE_FAILED] ' . json_encode(['order_id' => $order_id, 'razorpay_order_id' => $razorpay_order_id, 'payment_id' => $razorpay_payment_id]) . PHP_EOL, FILE_APPEND);
        throw new Exception('Failed to update order status to paid.');
    }

    // Step 3: Fetch order items with color variations
    $stmt = $pdo->prepare("
        SELECT oi.product_id, oi.color_variation_id, oi.quantity, oi.price, 
               p.name as product_name, pcv.color_name, pcv.hex_code
        FROM order_items oi 
        JOIN products p ON oi.product_id = p.id
        LEFT JOIN product_color_variations pcv ON oi.color_variation_id = pcv.id
        WHERE oi.order_id = ?
    ");
    $stmt->execute([$order_id]);
    $order_items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($order_items)) {
        error_log("[confirm_payment] No order_items found for order_id $order_id, razorpay_order_id $razorpay_order_id");
        throw new Exception("No valid order items found to process for order. Please contact support.");
    }

    // Decrement stock for each order item
    foreach ($order_items as $item) {
        if (!empty($item['color_variation_id'])) {
            // Check current stock
            $stmt = $pdo->prepare("SELECT stock FROM product_color_variations WHERE id = ?");
            $stmt->execute([$item['color_variation_id']]);
            $currentStock = (int)($stmt->fetchColumn());
            if ($currentStock < $item['quantity']) {
                throw new Exception('Insufficient stock for ' . $item['product_name'] . ($item['color_name'] ? ' (' . $item['color_name'] . ')' : '') . '. Only ' . $currentStock . ' units available.');
            }
            $stmt = $pdo->prepare("UPDATE product_color_variations SET stock = stock - ? WHERE id = ?");
            $stmt->execute([$item['quantity'], $item['color_variation_id']]);
        } else {
            // Check current stock
            $stmt = $pdo->prepare("SELECT stock FROM products WHERE id = ?");
            $stmt->execute([$item['product_id']]);
            $currentStock = (int)($stmt->fetchColumn());
            if ($currentStock < $item['quantity']) {
                throw new Exception('Insufficient stock for ' . $item['product_name'] . '. Only ' . $currentStock . ' units available.');
            }
            $stmt = $pdo->prepare("UPDATE products SET stock = stock - ? WHERE id = ?");
            $stmt->execute([$item['quantity'], $item['product_id']]);
        }
    }

    // Step 5: Update user's last used address
    if (!empty($order['shipping_address'])) {
        $encrypted_address = encrypt_data($order['shipping_address']);
        $update_stmt = $pdo->prepare("UPDATE users SET last_used_address = ? WHERE id = ?");
        $update_stmt->execute([$encrypted_address, $user_id]);
    }

    // Record Coupon Usage
    if (!empty($order['coupon_code'])) {
        // Fetch coupon ID
        $stmt = $pdo->prepare("SELECT id FROM coupons WHERE code = ?");
        $stmt->execute([$order['coupon_code']]);
        $couponId = $stmt->fetchColumn();
        
        if ($couponId) {
            $stmt = $pdo->prepare("INSERT INTO coupon_usages (coupon_id, user_id, guest_email, order_id) VALUES (?, ?, ?, ?)");
            $stmt->execute([$couponId, $user_id, $order['guest_email'], $order_id]);
        }
    }

    // Always update order with name/address from payment payload (encrypted)
    $updateFields = [];
    $updateValues = [];
    foreach ([['name','name'],['shipping_address','shipping_address'],['billing_address','billing_address']] as [$field, $payloadKey]) {
        if (!empty($data[$payloadKey])) {
            $updateFields[] = "$field = ?";
            $updateValues[] = encrypt_data($data[$payloadKey]);
            $order[$field] = $data[$payloadKey]; // For email
        }
    }
    if ($updateFields) {
        $updateValues[] = $order_id;
        $stmt = $pdo->prepare("UPDATE orders SET ".implode(", ", $updateFields)." WHERE id = ?");
        $stmt->execute($updateValues);
    }

    // Step 6: Prepare items for email with color information
    $detailed_items = [];
    foreach ($order_items as $item) {
        $item_name = $item['product_name'];
        if (!empty($item['color_name'])) {
            $item_name .= " (" . $item['color_name'] . ")";
        }
        $detailed_items[] = [
            'name' => $item_name,
            'quantity' => $item['quantity'],
            'price' => $item['price']
        ];
    }

    // Step 7: Send confirmation email with full details
    $order_email = !empty($order['user_email']) ? $order['user_email'] : (!empty($order['guest_email']) ? $order['guest_email'] : 'guest@example.com');
    // Note: Guest email is typically not stored in current orders table schema, defaulting for now or skipping email.
    // Ideally update schema to store guest email. For now, check if we can get it from somewhere else or just skip.
    
    // Attempting to send only if we have an email
     $emailSent = false;
    if ($order_email && $order_email !== 'guest@example.com') {
         // Decrypt name for email
         $decrypted_name = robust_decrypt($order['name'], 'name');
         
         $emailSent = sendPaymentConfirmationEmail([
            'to' => $order_email,
            'name' => $decrypted_name, // Pass decrypted name to email function if needed, or update template
            'subject' => 'Payment Confirmed - Your ShopNest Order #' . $order_id,
            'order_id' => $order_id,
            'payment_id' => $razorpay_payment_id,
            'total_amount' => $order['total_amount'],
            'items' => $detailed_items
        ]);
    }

    if (!$emailSent) {
        error_log("[confirm_payment] Payment confirmation email failed for order_id $order_id, email {$order['email']}");
        // Do NOT rollback, just return a warning
        $pdo->commit();
        echo json_encode(['success' => true, 'data' => ['status' => 'success', 'warning' => 'Order placed, but confirmation email failed.']]);
        exit;
    }

    // All good, commit the transaction
    $pdo->commit();
    echo json_encode(['success' => true, 'data' => ['status' => 'success']]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
    $pdo->rollBack();
    }
    error_log("[confirm_payment] Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>