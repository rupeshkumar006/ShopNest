<?php
require_once '../cors.php';
header("Content-Type: application/json");

require_once '../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->id)) {
    echo json_encode(['success' => false, 'error' => 'ID is required']);
    exit;
}

try {
    $stmt = $pdo->prepare("DELETE FROM coupons WHERE id = ?");
    $stmt->execute([$data->id]);

    echo json_encode(['success' => true, 'message' => 'Coupon deleted successfully']);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
