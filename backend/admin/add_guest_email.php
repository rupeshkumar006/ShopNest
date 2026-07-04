<?php
require_once '../config/db.php';

try {
    $pdo->exec("ALTER TABLE orders ADD COLUMN guest_email VARCHAR(255) DEFAULT NULL");
    echo "Added guest_email column to orders table.\n";
} catch (PDOException $e) {
    echo "Error adding guest_email: " . $e->getMessage() . "\n";
}
?>
