<?php
require_once __DIR__ . '/../cors.php';
require_once '../config/db.php';
require_once '../config/encryption.php';
header('Content-Type: application/json; charset=UTF-8');

try {
    $stmt = $pdo->query('SELECT r.*, u.name as user_name, u.email as user_email, u.avatar_url, p.name as product_name FROM product_reviews r LEFT JOIN users u ON r.user_id = u.id LEFT JOIN products p ON r.product_id = p.id ORDER BY r.created_at DESC');
    $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Log the number of reviews found
    error_log("Found " . count($reviews) . " reviews in database");
    
    foreach ($reviews as &$review) {
        if (!empty($review['user_id'])) {
            $stmtUser = $pdo->prepare('SELECT name, email FROM users WHERE id = ?');
            $stmtUser->execute([$review['user_id']]);
            $user = $stmtUser->fetch(PDO::FETCH_ASSOC);
            $review['user_name'] = $user && !empty($user['name']) ? robust_decrypt($user['name'], 'name') : 'Anonymous';
            $review['user_email'] = $user['email'] ?? '';
        } else {
            $review['user_name'] = 'Anonymous';
            $review['user_email'] = '';
        }
        $stmtImg = $pdo->prepare('SELECT image_url FROM product_review_images WHERE review_id = ?');
        $stmtImg->execute([$review['id']]);
        $review['images'] = $stmtImg->fetchAll(PDO::FETCH_COLUMN);
    }
    
    echo json_encode(['success' => true, 'data' => $reviews]);
} catch (Exception $e) {
    error_log("Error in get_all_reviews.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Failed to fetch reviews: ' . $e->getMessage()]);
} 