<?php
require_once __DIR__ . '/../cors.php';
require_once '../config/db.php';
require_once '../config/encryption.php';
header('Content-Type: application/json; charset=UTF-8');

$product_id = isset($_GET['product_id']) ? intval($_GET['product_id']) : 0;
if (!$product_id) {
    echo json_encode(['success' => false, 'error' => 'Product ID is required']);
    exit;
}

$stmt = $pdo->prepare('SELECT r.id, r.user_id, u.name as user_name, r.rating, r.review, r.created_at FROM product_reviews r LEFT JOIN users u ON r.user_id = u.id WHERE r.product_id = ? ORDER BY r.created_at DESC');
$stmt->execute([$product_id]);
$reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

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