<?php
header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/config/db.php';

try {
    // MySQL DDL statements causes implicit commit, strict transactions can cause issues or are ignored.
    
    // Create product_reviews table
    $pdo->exec("CREATE TABLE IF NOT EXISTS product_reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        user_id INT NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX (product_id),
        INDEX (user_id)
    )");

    // Create product_review_images table
    $pdo->exec("CREATE TABLE IF NOT EXISTS product_review_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        review_id INT NOT NULL,
        image_url VARCHAR(255) NOT NULL,
        FOREIGN KEY (review_id) REFERENCES product_reviews(id) ON DELETE CASCADE
    )");

    echo json_encode(['success' => true, 'message' => 'Reviews tables created successfully']);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
