<?php
header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../config/db.php';

$order_id = $_GET['order_id'] ?? '';

if (empty($order_id)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Order ID is required']);
    exit;
}

try {
    // Check main order or razorpay order id
    $stmt = $pdo->prepare("SELECT payment_id, status FROM orders WHERE order_id = ? OR razorpay_order_id = ?");
    $stmt->execute([$order_id, $order_id]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($order) {
        if ($order['status'] === 'paid') {
             echo json_encode(['success' => true, 'data' => ['status' => 'success', 'payment_id' => $order['payment_id']]]);
        } else {
             echo json_encode(['success' => true, 'data' => ['status' => 'pending']]);
        }
    } else {
        echo json_encode(['success' => false, 'error' => 'Order not found']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
