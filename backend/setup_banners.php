<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once 'config/db.php';

try {
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Create banners table
    $sql_banners = "CREATE TABLE IF NOT EXISTS banners (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NULL,
        description TEXT NULL,
        style_template VARCHAR(50) DEFAULT 'standard',
        is_active TINYINT(1) DEFAULT 1,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    $pdo->exec($sql_banners);
    echo "Table 'banners' created or already exists.\n";

    // Create banner_images table
    $sql_images = "CREATE TABLE IF NOT EXISTS banner_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        banner_id INT NOT NULL,
        image_url VARCHAR(255) NOT NULL,
        link_url VARCHAR(255) NULL,
        display_order INT DEFAULT 0,
        FOREIGN KEY (banner_id) REFERENCES banners(id) ON DELETE CASCADE
    )";
    $pdo->exec($sql_images);
    echo "Table 'banner_images' created or already exists.\n";

} catch(PDOException $e) {
    echo "Error creating table: " . $e->getMessage();
}
?>
