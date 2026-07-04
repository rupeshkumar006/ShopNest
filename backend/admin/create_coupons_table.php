<?php
require_once '../config/db.php';

try {
    // Drop table if exists to ensure clean schema
    $pdo->exec("DROP TABLE IF EXISTS coupons");

    // Create coupons table
    $sql = "CREATE TABLE IF NOT EXISTS coupons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        discount_type ENUM('percentage', 'fixed') NOT NULL,
        discount_value DECIMAL(10, 2) NOT NULL,
        min_order_amount DECIMAL(10, 2) DEFAULT 0,
        usage_limit_per_user INT DEFAULT 1,
        expiry_date DATETIME DEFAULT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    $pdo->exec($sql);
    echo "Table 'coupons' created/verified.<br>";

    // Insert initial coupons
    $coupons = [
        ['WELCOME50', 'percentage', 50.00, 0, 1, '2030-12-31 23:59:59'],
        ['SAVE20', 'percentage', 20.00, 500, 1, '2030-12-31 23:59:59'],
        ['WELCOME10', 'percentage', 10.00, 0, 1, '2030-12-31 23:59:59']
    ];

    $stmt = $pdo->prepare("INSERT IGNORE INTO coupons (code, discount_type, discount_value, min_order_amount, usage_limit_per_user, expiry_date) VALUES (?, ?, ?, ?, ?, ?)");

    foreach ($coupons as $coupon) {
        $stmt->execute($coupon);
        echo "Coupon '{$coupon[0]}' processed.<br>";
    }

    echo "Initial coupons seeded successfully.";

} catch (PDOException $e) {
    die("DB ERROR: " . $e->getMessage());
}
?>
