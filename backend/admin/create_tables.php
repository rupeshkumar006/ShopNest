<?php
require_once '../cors.php';
require_once '../config/db.php';

try {
    echo "Creating product_color_variations table... ";
    $sql1 = "CREATE TABLE IF NOT EXISTS product_color_variations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        color_name VARCHAR(255) NOT NULL,
        hex_code VARCHAR(50) DEFAULT NULL,
        price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        stock INT NOT NULL DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        image_url TEXT,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB";
    $pdo->exec($sql1);
    echo "Success.<br>";

    echo "Creating product_color_images table... ";
    $sql2 = "CREATE TABLE IF NOT EXISTS product_color_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        color_variation_id INT NOT NULL,
        image_url TEXT NOT NULL,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (color_variation_id) REFERENCES product_color_variations(id) ON DELETE CASCADE
    ) ENGINE=InnoDB";
    $pdo->exec($sql2);
    echo "Success.<br>";
    
    // Also check if products table is MyISAM and convert to InnoDB if possible? 
    // Usually XAMPP default is InnoDB but let's leave it.

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
