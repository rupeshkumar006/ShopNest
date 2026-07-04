<?php
require_once __DIR__ . '/../cors.php';
require_once '../config/db.php';
header('Content-Type: application/json; charset=UTF-8');

$input = json_decode(file_get_contents('php://input'), true);
$review_id = isset($input['review_id']) ? intval($input['review_id']) : 0;
$is_featured = isset($input['is_featured']) ? intval($input['is_featured']) : 0;
$review_type = isset($input['review_type']) ? $input['review_type'] : 'product'; // Add review_type parameter

if (!$review_id) {
    echo json_encode(['success' => false, 'error' => 'Review ID is required']);
    exit;
}

if ($is_featured) {
    // Check total featured reviews (only product)
    $stmt = $pdo->query('SELECT COUNT(*) FROM product_reviews WHERE is_homepage_featured = 1');
    $productFeatured = $stmt->fetchColumn();
    
    // Service featured check removed
    
    if ($productFeatured >= 4) {
        echo json_encode(['success' => false, 'error' => 'Only 4 reviews can be featured']);
        exit;
    }
}

// Update the product_reviews table
$stmt = $pdo->prepare('UPDATE product_reviews SET is_homepage_featured = ? WHERE id = ?');
$stmt->execute([$is_featured, $review_id]);

echo json_encode(['success' => true]); 