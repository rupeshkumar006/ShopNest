<?php
require_once __DIR__ . '/config/db.php';
header('Content-Type: text/plain');

function checkCol($pdo, $table, $col) {
    try {
        $stmt = $pdo->query("DESCRIBE $table");
        $cols = $stmt->fetchAll(PDO::FETCH_COLUMN);
        return in_array($col, $cols) ? "YES" : "NO";
    } catch (Exception $e) {
        return "ERROR";
    }
}

echo "Cart guest_id: " . checkCol($pdo, 'cart', 'guest_id') . "\n";
echo "Cart color_variation_id: " . checkCol($pdo, 'cart', 'color_variation_id') . "\n";
echo "Wishlist guest_id: " . checkCol($pdo, 'wishlist', 'guest_id') . "\n";
echo "Wishlist color_variation_id: " . checkCol($pdo, 'wishlist', 'color_variation_id') . "\n";
?>
