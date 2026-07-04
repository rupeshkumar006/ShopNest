<?php
require_once '../cors.php';
header("Content-Type: application/json");

require_once '../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->code) || !isset($data->discount_type) || !isset($data->discount_value)) {
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit;
}

try {
    // Check if code exists
    $stmt = $pdo->prepare("SELECT id FROM coupons WHERE code = ?");
    $stmt->execute([$data->code]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'error' => 'Coupon code already exists']);
        exit;
    }

    $sql = "INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, usage_limit_per_user, is_active) VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    
    $min_order = isset($data->min_order_amount) ? $data->min_order_amount : 0;
    $usage_limit = isset($data->usage_limit_per_user) ? $data->usage_limit_per_user : 1;
    $is_active = isset($data->is_active) ? ($data->is_active ? 1 : 0) : 1;

    $stmt->execute([
        $data->code,
        $data->discount_type,
        $data->discount_value,
        $min_order,
        $usage_limit,
        $is_active
    ]);

    echo json_encode(['success' => true, 'message' => 'Coupon created successfully', 'id' => $pdo->lastInsertId()]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
