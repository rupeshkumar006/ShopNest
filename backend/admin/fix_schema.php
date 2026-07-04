<?php
require_once '../cors.php';
require_once '../config/db.php';

echo "Attempting to fix products table schema...<br>";

try {
    // Add delivery_days column
    echo "Adding delivery_days... ";
    try {
        $pdo->exec("ALTER TABLE products ADD COLUMN delivery_days INT DEFAULT 7");
        echo "Success.<br>";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
            echo "Already exists.<br>";
        } else {
            echo "Failed: " . $e->getMessage() . "<br>";
        }
    }

    // Add unit_type column
    echo "Adding unit_type... ";
    try {
        $pdo->exec("ALTER TABLE products ADD COLUMN unit_type ENUM('pieces','packets') NOT NULL DEFAULT 'pieces'");
        echo "Success.<br>";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
            echo "Already exists.<br>";
        } else {
            echo "Failed: " . $e->getMessage() . "<br>";
        }
    }

    // Add packet_size column
    echo "Adding packet_size... ";
    try {
        $pdo->exec("ALTER TABLE products ADD COLUMN packet_size INT NULL");
        echo "Success.<br>";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
            echo "Already exists.<br>";
        } else {
            echo "Failed: " . $e->getMessage() . "<br>";
        }
    }
    
    echo "Schema fix completed.";

} catch (Exception $e) {
    echo "Critical Error: " . $e->getMessage();
}
?>
