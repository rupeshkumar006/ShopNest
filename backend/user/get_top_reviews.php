<?php
require_once __DIR__ . '/../cors.php';
require_once '../config/db.php';
require_once '../config/encryption.php';
header('Content-Type: application/json; charset=UTF-8');

// Fetch up to 4 featured product reviews
$productReviews = $pdo->query('
    SELECT r.id, "product" as type, u.name as user_name, r.rating, r.review, r.created_at, p.name as item_name
    FROM product_reviews r
    LEFT JOIN users u ON r.user_id = u.id
    LEFT JOIN products p ON r.product_id = p.id
    WHERE r.is_homepage_featured = 1
    ORDER BY r.created_at DESC
    LIMIT 4
')->fetchAll(PDO::FETCH_ASSOC);

// Fetch up to 4 featured service reviews (with error handling)
$serviceReviews = [];
try {
    $serviceReviews = $pdo->query('
        SELECT r.id, "service" as type, u.name as user_name, r.rating, r.review, r.created_at, s.name as item_name
        FROM service_reviews r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN services s ON r.service_id = s.id
        WHERE r.is_homepage_featured = 1
        ORDER BY r.created_at DESC
        LIMIT 4
    ')->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    // If is_homepage_featured column doesn't exist, add it and try again
    if (strpos($e->getMessage(), "Unknown column 'is_homepage_featured'") !== false) {
        try {
            $pdo->exec('ALTER TABLE service_reviews ADD COLUMN is_homepage_featured TINYINT(1) DEFAULT 0');
            $serviceReviews = $pdo->query('
                SELECT r.id, "service" as type, u.name as user_name, r.rating, r.review, r.created_at, s.name as item_name
                FROM service_reviews r
                LEFT JOIN users u ON r.user_id = u.id
                LEFT JOIN services s ON r.service_id = s.id
                WHERE r.is_homepage_featured = 1
                ORDER BY r.created_at DESC
                LIMIT 4
            ')->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e2) {
            // If still fails, just use empty array
            $serviceReviews = [];
        }
    }
}

// Combine and process all reviews
$allReviews = array_merge($productReviews, $serviceReviews);

// Sort by creation date (newest first) and limit to 4 total
usort($allReviews, function($a, $b) {
    return strtotime($b['created_at']) - strtotime($a['created_at']);
});
$topReviews = array_slice($allReviews, 0, 4);

// Attach images and process each review
foreach ($topReviews as &$review) {
    // Decrypt user name
    $user_email = '';
    if (!empty($review['user_name'])) {
        $review['user_name'] = robust_decrypt($review['user_name'], 'name');
        $stmtEmail = $pdo->prepare('SELECT email FROM users WHERE name = ? LIMIT 1');
        $stmtEmail->execute([$review['user_name']]);
        $user = $stmtEmail->fetch(PDO::FETCH_ASSOC);
        $user_email = $user && !empty($user['email']) ? $user['email'] : '';
        $review['user_email'] = $user_email;
    } else {
        $review['user_name'] = 'Anonymous';
        $review['user_email'] = '';
    }
    
    // Attach images based on review type
    if ($review['type'] === 'product') {
        $stmtImg = $pdo->prepare('SELECT image_url FROM product_review_images WHERE review_id = ?');
        $stmtImg->execute([$review['id']]);
        $review['images'] = $stmtImg->fetchAll(PDO::FETCH_COLUMN);
    } else {
        // Service review images
        try {
            $stmtImg = $pdo->prepare('SELECT image_url FROM service_review_images WHERE review_id = ?');
            $stmtImg->execute([$review['id']]);
            $review['images'] = $stmtImg->fetchAll(PDO::FETCH_COLUMN);
        } catch (Exception $e) {
            $review['images'] = [];
        }
    }
}

echo json_encode(['success' => true, 'data' => $topReviews]); 