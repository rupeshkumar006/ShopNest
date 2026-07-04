<?php
require_once '../cors.php';
require_once '../config/db.php';

try {
    // Select active coupons, filtering out expired ones
    $stmt = $pdo->prepare("SELECT code, discount_type, discount_value, min_order_amount, expiry_date 
                           FROM coupons 
                           WHERE is_active = 1 
                           AND (expiry_date IS NULL OR expiry_date > NOW())
                           ORDER BY discount_value DESC");
    $stmt->execute();
    $coupons = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'data' => $coupons]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Failed to fetch coupons']);
}
?>
