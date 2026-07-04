<?php
require_once __DIR__ . '/../config/db.php';

try {
    $sql = "CREATE TABLE IF NOT EXISTS coupon_usages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        coupon_id INT NOT NULL,
        user_id INT NULL,
        guest_email VARCHAR(255) NULL,
        order_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (coupon_id) REFERENCES coupons(id),
        FOREIGN KEY (order_id) REFERENCES orders(id)
    )";
    
    $pdo->exec($sql);
    echo "Table coupon_usages created or already exists.\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
