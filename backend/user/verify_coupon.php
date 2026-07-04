<?php
require_once '../cors.php';
require_once '../config/db.php';
require_once '../config/jwt_helper.php';

$user_id = null;
try {
    $userData = get_user_from_jwt();
    if ($userData && isset($userData['sub'])) {
        $user_id = $userData['sub'];
    }
} catch (Exception $e) {
    // Guest
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$code = $data['code'] ?? '';
$code = $data['code'] ?? '';
$cartTotal = $data['cart_total'] ?? 0;
$guest_email = $data['guest_email'] ?? '';

if (empty($code)) {
    echo json_encode(['success' => false, 'error' => 'Coupon code is required']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT * FROM coupons WHERE code = ? AND is_active = 1");
    $stmt->execute([$code]);
    $coupon = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$coupon) {
        echo json_encode(['success' => false, 'error' => 'Invalid or inactive coupon code']);
        exit;
    }

    // Check expiry
    if ($coupon['expiry_date'] && new DateTime($coupon['expiry_date']) < new DateTime()) {
        echo json_encode(['success' => false, 'error' => 'Coupon has expired']);
        exit;
    }

    // Check minimum order value
    if ($cartTotal < $coupon['min_order_amount']) {
        echo json_encode([
            'success' => false, 
            'error' => "Minimum order value of ₹{$coupon['min_order_amount']} required"
        ]);
        exit;
    }

    // Check usage limit per user
    if ($user_id && !empty($coupon['usage_limit_per_user'])) {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM coupon_usages WHERE coupon_id = ? AND user_id = ?");
        $stmt->execute([$coupon['id'], $user_id]);
        $usageCount = $stmt->fetchColumn();

        if ($usageCount >= $coupon['usage_limit_per_user']) {
             echo json_encode([
                'success' => false, 
                'error' => "You have reached the usage limit for this coupon"
            ]);
            exit;
        }
        if ($usageCount >= $coupon['usage_limit_per_user']) {
             echo json_encode([
                'success' => false, 
                'error' => "You have reached the usage limit for this coupon"
            ]);
            exit;
        }
    } elseif (!empty($coupon['usage_limit_per_user']) && empty($user_id)) {
        // Guest with limited coupon MUST have email
         if (empty($guest_email)) {
            echo json_encode(['success' => false, 'error' => 'Email address is required to use this limited-use coupon']);
            exit;
        }
        
        // Check usage limit for guest email
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM coupon_usages WHERE coupon_id = ? AND guest_email = ?");
        $stmt->execute([$coupon['id'], $guest_email]);
        $usageCount = $stmt->fetchColumn();

        if ($usageCount >= $coupon['usage_limit_per_user']) {
             echo json_encode([
                'success' => false, 
                'error' => "You have reached the usage limit for this coupon"
            ]);
            exit;
        }
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'code' => $coupon['code'],
            'discount_type' => $coupon['discount_type'],
            'discount_value' => (float)$coupon['discount_value'],
            'min_order_amount' => (float)$coupon['min_order_amount']
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error']);
}
?>
