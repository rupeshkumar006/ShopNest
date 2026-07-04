<?php
require_once '../config/db.php';

try {
    $pdo->exec("ALTER TABLE orders MODIFY COLUMN phone VARCHAR(255)");
    echo "Modified phone to VARCHAR(255).\n";
} catch (PDOException $e) {
    echo "Error modifying phone: " . $e->getMessage() . "\n";
}
?>
