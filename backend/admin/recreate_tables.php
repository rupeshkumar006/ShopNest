<?php
require_once '../cors.php';
require_once '../config/db.php';

echo "Forcing table recreation...<br>";

try {
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
    
    echo "Dropping product_color_images... ";
    $pdo->exec("DROP TABLE IF EXISTS product_color_images");
    echo "Success.<br>";

    echo "Dropping product_color_variations... ";
    $pdo->exec("DROP TABLE IF EXISTS product_color_variations");
    echo "Success.<br>";
    
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

    echo "Creating product_color_variations table... ";
    $sql1 = "CREATE TABLE product_color_variations (
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
    $sql2 = "CREATE TABLE product_color_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        color_variation_id INT NOT NULL,
        image_url TEXT NOT NULL,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (color_variation_id) REFERENCES product_color_variations(id) ON DELETE CASCADE
    ) ENGINE=InnoDB";
    $pdo->exec($sql2);
    echo "Success.<br>";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
