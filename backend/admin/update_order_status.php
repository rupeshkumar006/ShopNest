<?php
header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/../cors.php';
require_once '../config/db.php';
require_once __DIR__ . '/../config/jwt_helper.php';
require_once __DIR__ . '/../utils/send_email.php';
require_once __DIR__ . '/../config/encryption.php';

$jwt_user = get_user_from_jwt();
if (!$jwt_user || empty($jwt_user['admin']) || !$jwt_user['admin']) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);
$orderId = $input['orderId'] ?? null;
$status = $input['status'] ?? null;

if (!$orderId || !$status) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Order ID and status are required']);
    exit();
}

try {
    $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
    $stmt->execute([$status, $orderId]);

    // Fetch user email (or guest email) and name for notification
    $stmt = $pdo->prepare("SELECT u.email as user_email, o.guest_email, o.name, o.id FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.id = ?");
    $stmt->execute([$orderId]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($order && strtolower($status) === 'delivered') {
        // Fetch order items
        $stmtItems = $pdo->prepare("SELECT oi.quantity, p.name as product_name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?");
        $stmtItems->execute([$orderId]);
        $items = $stmtItems->fetchAll(PDO::FETCH_ASSOC);
        $itemsList = '';
        foreach ($items as $item) {
            $itemsList .= '<li>' . htmlspecialchars($item['product_name']) . ' x ' . htmlspecialchars($item['quantity']) . '</li>';
        }
        $subject = 'Your Order Has Been Delivered!';
        $decrypted_name = robust_decrypt($order['name'], 'name');
        $body = "<h2>Order Delivered</h2><p>Dear {$decrypted_name},</p><p>Your order #{$order['id']} has been delivered. Thank you for shopping with ShopNest!</p>";
        $body .= "<h3>Order Details:</h3><ul>" . $itemsList . "</ul>";
        
        $email_to_send = !empty($order['user_email']) ? $order['user_email'] : (!empty($order['guest_email']) ? $order['guest_email'] : '');
        
        if ($email_to_send) {
            sendGeneralEmail($email_to_send, $subject, $body);
        }
    }

    echo json_encode(['success' => true, 'message' => 'Order status updated']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to update order status']);
}
?> 