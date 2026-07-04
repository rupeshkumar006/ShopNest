<?php
require_once __DIR__ . '/config/db.php';
header('Content-Type: application/json');

function checkColumn($pdo, $table, $col) {
    try {
        $stmt = $pdo->query("DESCRIBE $table");
        $cols = $stmt->fetchAll(PDO::FETCH_COLUMN);
        return in_array($col, $cols);
    } catch (Exception $e) {
        return false;
    }
}

$status = [
    'cart_guest_id' => checkColumn($pdo, 'cart', 'guest_id'),
    'wishlist_guest_id' => checkColumn($pdo, 'wishlist', 'guest_id'),
    'orders_guest_id' => checkColumn($pdo, 'orders', 'guest_id'),
];

echo json_encode($status);
?>
