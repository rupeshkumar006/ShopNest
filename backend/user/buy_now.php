<?php
require_once '../cors.php';
require_once '../config/db.php';
require_once __DIR__ . '/../config/jwt_helper.php';
require_once __DIR__ . '/../config/razorpay.php';
require_once __DIR__ . '/../config/encryption.php';

$data = json_decode(file_get_contents('php://input'), true);

$product_id = isset($data['product_id']) ? intval($data['product_id']) : 0;
$quantity = isset($data['quantity']) ? intval($data['quantity']) : 1;
$color_variation_id = isset($data['color_variation_id']) ? intval($data['color_variation_id']) : null;
$name = isset($data['name']) ? trim($data['name']) : '';
$phone = isset($data['phone']) ? trim($data['phone']) : '';

$jwt_user = get_user_from_jwt();
$user_id = $jwt_user ? $jwt_user['sub'] : null;

// Guest logic
$guest_id = null;
if (!$user_id) {
    require_once __DIR__ . '/../config/guest_helper.php';
    $guest_id = get_guest_id();
}

if ((!$user_id && !$guest_id) || $product_id <= 0 || $quantity <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid request data']);
    exit;
}

// Validate phone
$final_phone = '';
if (preg_match('/^\+91\d{10}$/', $phone)) {
    $final_phone = $phone;
} elseif (preg_match('/^\d{10}$/', $phone)) {
    $final_phone = '+91' . $phone;
}
if (!$final_phone) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid or missing phone number']);
    exit;
}

try {
    $pdo->beginTransaction();

    // Get product details
    $stmt = $pdo->prepare('SELECT name, delivery_days FROM products WHERE id = ?');
    $stmt->execute([$product_id]);
    $product = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$product) {
        throw new Exception('Product not found');
    }

    // Get color variation details if specified
    $price = 0;
    $stock = 0;
    $color_name = null;
    $has_color_variations = false;
    // Check if product has color variations
    $stmt = $pdo->prepare('SELECT COUNT(*) as cnt FROM product_color_variations WHERE product_id = ? AND is_active = 1');
    $stmt->execute([$product_id]);
    $colorVarCount = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($colorVarCount && $colorVarCount['cnt'] > 0) {
        $has_color_variations = true;
    }
    if ($has_color_variations) {
        if ($color_variation_id) {
            $stmt = $pdo->prepare('SELECT price, stock, color_name FROM product_color_variations WHERE id = ? AND product_id = ? AND is_active = 1');
            $stmt->execute([$color_variation_id, $product_id]);
            $colorVariation = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$colorVariation) {
                throw new Exception('Color variation not found');
            }
            $price = floatval($colorVariation['price']);
            $stock = intval($colorVariation['stock']);
            $color_name = $colorVariation['color_name'];
        } else {
            $stmt = $pdo->prepare('SELECT price, stock, color_name FROM product_color_variations WHERE product_id = ? AND is_active = 1 ORDER BY id ASC LIMIT 1');
            $stmt->execute([$product_id]);
            $colorVariation = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$colorVariation) {
                throw new Exception('No color variation found for this product');
            }
            $price = floatval($colorVariation['price']);
            $stock = intval($colorVariation['stock']);
            $color_name = $colorVariation['color_name'];
        }
    } else {
        // No color variations, use product price/stock
        $stmt = $pdo->prepare('SELECT price, stock FROM products WHERE id = ?');
        $stmt->execute([$product_id]);
        $prod = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$prod) {
            throw new Exception('Product not found');
        }
        $price = floatval($prod['price']);
        $stock = intval($prod['stock']);
    }

    if ($stock < $quantity) {
        throw new Exception('Insufficient stock');
    }

    $total_amount = $price * $quantity;

    // Create Razorpay order
    error_log("Razorpay keys - Key: " . (defined('RAZORPAY_KEY') ? 'defined' : 'undefined') . ", Secret: " . (defined('RAZORPAY_SECRET') ? 'defined' : 'undefined'));
    $api = new Razorpay\Api\Api(RAZORPAY_KEY, RAZORPAY_SECRET);
    
    $razorpayOrder = $api->order->create([
        'amount' => $total_amount * 100, // Convert to paise
        'currency' => 'INR',
        'receipt' => 'order_' . time(),
        'notes' => [
            'user_id' => $user_id,
            'guest_id' => $guest_id,
            'product_id' => $product_id,
            'color_variation_id' => $color_variation_id,
            'quantity' => $quantity
        ]
    ]);

    // Handle User/Guest Details
    $user_name = $name;
    $user_address = '';

    if ($user_id) {
        $stmt = $pdo->prepare('SELECT name, phone, address FROM users WHERE id = ?');
        $stmt->execute([$user_id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Use provided name or fallback to profile (if name is missing in request, though it should be passed)
        if (!$user_name) {
             $user_name = $user ? robust_decrypt($user['name'], 'name') : '';
        }
        $user_address = $user ? robust_decrypt($user['address'], 'text') : '';
    } else {
        // Guest mode: Name must be provided in request
        if (!$user_name) {
            throw new Exception('Guest checkout requires a name.');
        }
    }

    // Ensure user name is not empty/null
    if (!$user_name || trim($user_name) === '') {
        throw new Exception('Name is missing.');
    }

    // Create order in database with status 'initiated' and encrypted details
    $custom_order_id = 'order_' . uniqid();
    $encryptedName = $user_name ? encrypt_data($user_name) : null;
    $encryptedPhone = $final_phone ? encrypt_data($final_phone) : null;
    $encryptedAddress = $user_address ? encrypt_data($user_address) : null;

    $stmt = $pdo->prepare('INSERT INTO orders (user_id, guest_id, order_id, total_amount, name, phone, shipping_address, billing_address, razorpay_order_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([
        $user_id,
        $guest_id,
        $custom_order_id,
        $total_amount,
        $encryptedName,
        $encryptedPhone,
        $encryptedAddress,
        $encryptedAddress,
        $razorpayOrder['id'],
        'initiated'
    ]);
    $order_id = $pdo->lastInsertId();
    // Debug log for buy now order creation
    file_put_contents(__DIR__ . '/../payments/debug_create_order.log', '[BUY_NOW] ' . json_encode([
        'order_id' => $order_id,
        'razorpay_order_id' => $razorpayOrder['id'],
        'custom_order_id' => $custom_order_id,
        'user_id' => $user_id,
        'total_amount' => $total_amount
    ]) . PHP_EOL, FILE_APPEND);
    
    // Insert order item with color variation
    $stmt = $pdo->prepare('INSERT INTO order_items (order_id, product_id, color_variation_id, quantity, price) VALUES (?, ?, ?, ?, ?)');
    $stmt->execute([$order_id, $product_id, $color_variation_id, $quantity, $price]);
    
    $pdo->commit();

    echo json_encode([
        'success' => true,
        'data' => [
            'order_id' => $razorpayOrder['id'],
            'amount' => $total_amount * 100, // For Razorpay
            'currency' => 'INR',
            'key_id' => RAZORPAY_KEY,
            'product_name' => $product['name'] . ($color_name ? " ($color_name)" : ''),
            'quantity' => $quantity,
            'price' => $price, // Per-product price, not multiplied
            'product_id' => $product_id,
            'color_variation_id' => $color_variation_id,
        ]
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Buy now error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?> 