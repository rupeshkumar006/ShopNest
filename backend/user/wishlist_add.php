<?php
require_once '../cors.php';
require_once '../config/db.php';
require_once __DIR__ . '/../config/jwt_helper.php';

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$product_id = isset($input['product_id']) ? intval($input['product_id']) : 0;
$color_variation_id = isset($input['color_variation_id']) ? intval($input['color_variation_id']) : null;

$jwt_user = get_user_from_jwt();
$user_id = $jwt_user ? $jwt_user['sub'] : null;

// Guest logic
$guest_id = null;
if (!$user_id) {
    require_once __DIR__ . '/../config/guest_helper.php';
    $guest_id = get_guest_id();
}

if ((!$user_id && !$guest_id) || !$product_id) {
    echo json_encode(['success' => false, 'error' => 'Invalid user or product']);
    exit;
}

// Defensive: Always use a real color variant ID for color variant products
$stmt = $pdo->prepare('SELECT COUNT(*) FROM product_color_variations WHERE product_id = ?');
$stmt->execute([$product_id]);
$has_color_variants = $stmt->fetchColumn() > 0;

if ($has_color_variants && (!$color_variation_id || $color_variation_id == 0)) {
    // Get the first color variant's ID
    $stmt2 = $pdo->prepare('SELECT id FROM product_color_variations WHERE product_id = ? ORDER BY id ASC LIMIT 1');
    $stmt2->execute([$product_id]);
    $color_variation_id = $stmt2->fetchColumn();
    if (!$color_variation_id) $color_variation_id = null;
}

// Check if already in wishlist
if ($user_id) {
    $stmt = $pdo->prepare("SELECT * FROM wishlist WHERE user_id = ? AND product_id = ? AND (color_variation_id = ? OR (color_variation_id IS NULL AND ? IS NULL))");
    $stmt->execute([$user_id, $product_id, $color_variation_id, $color_variation_id]);
} else {
    $stmt = $pdo->prepare("SELECT * FROM wishlist WHERE guest_id = ? AND product_id = ? AND (color_variation_id = ? OR (color_variation_id IS NULL AND ? IS NULL))");
    $stmt->execute([$guest_id, $product_id, $color_variation_id, $color_variation_id]);
}

if ($stmt->fetch()) {
    echo json_encode(['success' => true, 'message' => 'Already in wishlist']);
    exit;
}

$stmt = $pdo->prepare("INSERT INTO wishlist (user_id, guest_id, product_id, color_variation_id) VALUES (?, ?, ?, ?)");
if ($stmt->execute([$user_id, $guest_id, $product_id, $color_variation_id])) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => 'Failed to add to wishlist']);
}
?>