<?php
require_once '../cors.php';
header("Content-Type: application/json");

require_once '../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->id) || !isset($data->is_active)) {
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE coupons SET is_active = ? WHERE id = ?");
    $stmt->execute([$data->is_active ? 1 : 0, $data->id]);

    echo json_encode(['success' => true, 'message' => 'Coupon status updated successfully']);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
