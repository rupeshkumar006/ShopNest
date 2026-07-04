<?php
header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../config/jwt_helper.php';
$jwt_user = get_user_from_jwt();
if (!$jwt_user || empty($jwt_user['admin']) || !$jwt_user['admin']) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit();
}
require_once '../config/db.php';
header('Content-Type: application/json');

// Services column check removed

try {
    $pdo->exec('ALTER TABLE products ADD COLUMN deleted TINYINT(1) DEFAULT 0');
} catch (PDOException $e) {
    // Column already exists, ignore
}

// Get counts - only count non-deleted items
$userCount = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
$orderCount = $pdo->query("SELECT COUNT(*) FROM orders")->fetchColumn();

// Debug: Check what's in the services table
// $allServices = $pdo->query("SELECT id, name, deleted, is_active FROM services")->fetchAll(PDO::FETCH_ASSOC);
// error_log("All services: " . json_encode($allServices));

$productCount = $pdo->query("SELECT COUNT(*) FROM products WHERE deleted = 0 OR deleted IS NULL")->fetchColumn();

// Service count query removed

// Booking count query directly removed

echo json_encode([
    'success' => true,
    'data' => [
        'total_users' => $userCount,
        'total_orders' => $orderCount,
        'total_products' => $productCount
    ]
]);
?>