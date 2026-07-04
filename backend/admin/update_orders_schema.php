<?php
require_once '../config/db.php';

try {
    $pdo->exec("ALTER TABLE orders ADD COLUMN coupon_code VARCHAR(50) DEFAULT NULL");
    echo "Added coupon_code column.\n";
} catch (PDOException $e) {
    echo "coupon_code column might already exist or error: " . $e->getMessage() . "\n";
}

try {
    $pdo->exec("ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0.00");
    echo "Added discount_amount column.\n";
} catch (PDOException $e) {
    echo "discount_amount column might already exist or error: " . $e->getMessage() . "\n";
}
?>
