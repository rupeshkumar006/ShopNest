<?php
file_put_contents(__DIR__ . '/payment_debug.log', "Hit at " . date('Y-m-d H:i:s') . " URI: " . $_SERVER['REQUEST_URI'] . " Method: " . $_SERVER['REQUEST_METHOD'] . "\n", FILE_APPEND);
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt_helper.php';
require_once __DIR__ . '/../config/razorpay.php';
require_once __DIR__ . '/../config/encryption.php';

$data = json_decode(file_get_contents('php://input'), true);

error_log("Raw data received for order creation: " . file_get_contents('php://input'));
error_log("Decoded data for order creation: " . json_encode($data));

// Validate and sanitize input
$name = $data['name'] ?? '';
$phone = $data['phone'] ?? '';
$shipping_address = $data['shipping_address'] ?? '';
$billing_address = $data['billing_address'] ?? '';
$cart = $data['cart'] ?? [];
$platform_fee = $data['platform_fee'] ?? 0;
$delivery_charge = $data['delivery_charge'] ?? 0;
$subtotal = $data['subtotal'] ?? 0;
$coupon_code = $data['coupon_code'] ?? '';
$guest_email = $data['guest_email'] ?? null;
$discount_amount = 0;

// Always use checkout-provided values for the order
$final_name = $name;
$final_phone = '';
if (preg_match('/^\+91\d{10}$/', $phone)) {
    $final_phone = $phone;
} elseif (preg_match('/^\d{10}$/', $phone)) {
    $final_phone = '+91' . $phone;
}

error_log("Phone received for order: " . $phone);
error_log("Phone after normalization: " . $final_phone);
// If phone is still empty or invalid, do not proceed
if (!$final_name || !$final_phone || !$shipping_address || !$billing_address || empty($cart)) {
    error_log("Order creation failed due to missing/invalid phone: final_phone=" . $final_phone);
    echo json_encode(['success' => false, 'error' => ['message' => 'Missing required fields or invalid phone number']]);
    exit;
}

$user_id = null; // Default to guest (null)
try {
    $userData = get_user_from_jwt();
    if ($userData && isset($userData['sub'])) {
        $user_id = $userData['sub'];
    }
} catch (Exception $e) {
    // Guest checkout, ignore JWT error
    error_log("Guest checkout or JWT error: " . $e->getMessage());
}

try {
    $pdo->beginTransaction();

    // Calculate total amount initially
    $total_amount_before_discount = $subtotal + $platform_fee + $delivery_charge;

    // Verify and apply coupon if provided
    if (!empty($coupon_code)) {
        $stmt = $pdo->prepare("SELECT * FROM coupons WHERE code = ? AND is_active = 1");
        $stmt->execute([$coupon_code]);
        $coupon = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($coupon) {
            // Check expiry
            if (!$coupon['expiry_date'] || new DateTime($coupon['expiry_date']) >= new DateTime()) {
                // Check min order amount (compare against subtotal)
                if ($subtotal >= $coupon['min_order_amount']) {
                    if ($coupon['discount_type'] === 'percentage') {
                        $discount_val = ($subtotal * $coupon['discount_value']) / 100;
                    } else {
                        $discount_val = $coupon['discount_value'];
                    }
                    // Cap discount at subtotal if needed, or total? Usually subtotal.
                    $discount_amount = min($discount_val, $subtotal);
                }
            }
        }
    }

    $total_amount = $total_amount_before_discount - $discount_amount;
    
    // Validate that the calculated total matches the provided amount
    $provided_amount = $data['amount'] ?? 0;
    // Allow slight tolerance
    if (abs($total_amount - $provided_amount) > 1.00) { 
        error_log("Amount mismatch: calculated=$total_amount (sub:$subtotal + fee:$platform_fee + del:$delivery_charge - disc:$discount_amount), provided=$provided_amount");
        echo json_encode(['success' => false, 'error' => ['message' => 'Amount calculation mismatch. Please refresh and try again.']]);
        exit;
    }

    // Create order in database
    $custom_order_id = 'order_' . uniqid();
    $encrypted_phone = encrypt_data($final_phone);
    error_log("Phone after encryption: " . $encrypted_phone);
    if (empty($encrypted_phone)) {
        error_log("Encryption failed for phone: " . $final_phone);
        echo json_encode(['success' => false, 'error' => ['message' => 'Phone encryption failed']]);
        exit;
    }
    $stmt = $pdo->prepare("
        INSERT INTO orders (
            user_id, 
            order_id, 
            name, 
            phone, 
            shipping_address, 
            billing_address, 
            total_amount, 
            subtotal,
            platform_fee,
            delivery_charge,
            coupon_code,
            discount_amount,
            guest_email,
            status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'initiated')
    ");
    $stmt->execute([
        $user_id, 
        $custom_order_id, 
        encrypt_data($final_name), 
        $encrypted_phone, 
        encrypt_data($shipping_address), 
        encrypt_data($billing_address), 
        $total_amount,
        $subtotal,
        $platform_fee,
        $delivery_charge,
        $coupon_code,
        $discount_amount,
        $guest_email
    ]);

    // Get the inserted DB primary key
    $db_order_id = $pdo->lastInsertId();
    error_log("Order inserted with phone: " . $final_phone . ", encrypted: " . $encrypted_phone);

    // Create Razorpay order
    $api = new Razorpay\Api\Api(RAZORPAY_KEY, RAZORPAY_SECRET);
    $razorpayOrder = $api->order->create([
        'receipt' => $custom_order_id,
        'amount' => $total_amount * 100, // amount in paise
        'currency' => 'INR',
        'payment_capture' => 1
    ]);

    // Update order with Razorpay order ID
    $stmt = $pdo->prepare("UPDATE orders SET razorpay_order_id = ? WHERE id = ?");
    $stmt->execute([$razorpayOrder['id'], $db_order_id]);
    // Debug log for order creation and Razorpay order ID
    file_put_contents(__DIR__ . '/debug_create_order.log', json_encode([
        'db_order_id' => $db_order_id,
        'custom_order_id' => $custom_order_id,
        'razorpay_order_id' => $razorpayOrder['id'],
        'user_id' => $user_id,
        'total_amount' => $total_amount
    ]) . PHP_EOL, FILE_APPEND);
    // Fetch and log the order row after update
    $stmt = $pdo->prepare("SELECT id, order_id, razorpay_order_id, status FROM orders WHERE id = ?");
    $stmt->execute([$db_order_id]);
    $order_row = $stmt->fetch(PDO::FETCH_ASSOC);
    file_put_contents(__DIR__ . '/debug_create_order.log', '[ORDER_ROW] ' . json_encode($order_row) . PHP_EOL, FILE_APPEND);

    // Insert each cart item into order_items
    foreach ($cart as $item) {
        $product_id = $item['product_id'];
        $quantity = $item['quantity'];
        $price = $item['price'];
        $color_variation_id = isset($item['color_variation_id']) ? $item['color_variation_id'] : null;
        $stmt = $pdo->prepare("INSERT INTO order_items (order_id, product_id, quantity, price, color_variation_id) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$db_order_id, $product_id, $quantity, $price, $color_variation_id]);
        // Fix: Only update stock for color variant OR product, not both
        // Check and validate stock without updating (stock update happens in confirm_payment)
        if (!empty($color_variation_id)) {
            $stmt = $pdo->prepare("SELECT stock FROM product_color_variations WHERE id = ?");
            $stmt->execute([$color_variation_id]);
            $currentStock = $stmt->fetchColumn();
            if ($currentStock < $quantity) {
                http_response_code(400); 
                echo json_encode(['success' => false, 'error' => ['message' => 'Insufficient stock for a product']]);
                exit;
            }
        } else {
             $stmt = $pdo->prepare("SELECT stock FROM products WHERE id = ?");
             $stmt->execute([$product_id]);
             $currentStock = $stmt->fetchColumn();
              if ($currentStock < $quantity) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => ['message' => 'Insufficient stock for a product']]);
                exit;
            }
        }
    }

    // Commit transaction
    $pdo->commit();

    echo json_encode([
        'success' => true,
        'data' => [
            'key' => RAZORPAY_KEY,
            'amount' => $total_amount,
            'currency' => 'INR',
            'razorpay_order_id' => $razorpayOrder['id'],
            'order_id' => $custom_order_id,
            'db_order_id' => $db_order_id
        ]
    ]);

} catch (Exception $e) {
    // Rollback transaction on error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    error_log("Error in create_order.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => ['message' => 'Failed to create order: ' . $e->getMessage()]
    ]);
    file_put_contents(__DIR__ . '/payment_error.log', date('[Y-m-d H:i:s] ') . "Error: " . $e->getMessage() . "\nStack trace: " . $e->getTraceAsString() . "\n", FILE_APPEND);
}

// Add this endpoint to allow cancelling an order before payment
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($data['cancel_order_id'])) {
    $order_id = $data['cancel_order_id'];
    $stmt = $pdo->prepare("UPDATE orders SET status = 'cancelled' WHERE order_id = ? AND status = 'initiated'");
    $stmt->execute([$order_id]);
    echo json_encode(['success' => true, 'message' => 'Order cancelled']);
    exit;
}

// Add PATCH endpoint to set status to 'pending' when payment modal is opened
if ($_SERVER['REQUEST_METHOD'] === 'PATCH' && isset($data['set_pending_order_id'])) {
    $order_id = $data['set_pending_order_id'];
    $stmt = $pdo->prepare("UPDATE orders SET status = 'pending' WHERE order_id = ? AND status = 'initiated'");
    $stmt->execute([$order_id]);
    echo json_encode(['success' => true, 'message' => 'Order set to pending']);
    exit;
}
?>