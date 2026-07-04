<?php
require_once '../cors.php';
header("Content-Type: application/json");

require_once '../config/db.php';

try {
    $stmt = $pdo->prepare("SELECT * FROM coupons ORDER BY created_at DESC");
    $stmt->execute();
    $coupons = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'data' => $coupons]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
