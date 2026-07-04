<?php
require_once '../config/db.php';

try {
    $pdo->exec("ALTER TABLE order_items ADD COLUMN color_variation_id INT NULL");
    echo "Added color_variation_id column to order_items.\n";
} catch (PDOException $e) {
    echo "Error adding color_variation_id: " . $e->getMessage() . "\n";
}
?>
