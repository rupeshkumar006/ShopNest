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
if (!$user_id || !$product_id) {
    echo json_encode(['success' => false, 'error' => 'Invalid user or product']);
    exit;
}

// Explicit type casting for safety
$product_id = (int)$product_id;
$user_id = (int)$user_id;
$color_variation_id = $color_variation_id !== null ? (int)$color_variation_id : null;

error_log("[WISHLIST_REMOVE] product_id={$product_id}, color_variation_id={$color_variation_id}, user_id={$user_id}");

// Debug: Log the row that matches before deletion
$debug_stmt = $pdo->prepare('SELECT * FROM wishlist WHERE user_id = ? AND product_id = ? AND color_variation_id = ?');
$debug_stmt->execute([$user_id, $product_id, $color_variation_id]);
$debug_row = $debug_stmt->fetch(PDO::FETCH_ASSOC);
error_log('[WISHLIST_REMOVE] Row to delete: ' . print_r($debug_row, true));

if (array_key_exists('color_variation_id', $input)) {
    if ($color_variation_id === null) {
        // Remove wishlist entry where color_variation_id IS NULL
        $stmt = $pdo->prepare('DELETE FROM wishlist WHERE user_id = ? AND product_id = ? AND color_variation_id IS NULL');
        $success = $stmt->execute([$user_id, $product_id]);
        error_log("[WISHLIST_REMOVE] DELETE IS NULL result: " . var_export($success, true));
    } else {
    // Remove with color variant
    $stmt = $pdo->prepare('DELETE FROM wishlist WHERE user_id = ? AND product_id = ? AND color_variation_id = ?');
    $success = $stmt->execute([$user_id, $product_id, $color_variation_id]);
    error_log("[WISHLIST_REMOVE] DELETE variant result: " . var_export($success, true));
    }
} else {
    // Remove all wishlist entries for this product for this user (regardless of color variant)
    $stmt = $pdo->prepare('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?');
    $success = $stmt->execute([$user_id, $product_id]);
    error_log("[WISHLIST_REMOVE] DELETE all result: " . var_export($success, true));
}

// After the DELETE, log all remaining wishlist rows for this user and product
$check_stmt = $pdo->prepare('SELECT * FROM wishlist WHERE user_id = ? AND product_id = ?');
$check_stmt->execute([$user_id, $product_id]);
$remaining = $check_stmt->fetchAll(PDO::FETCH_ASSOC);
error_log('[WISHLIST_REMOVE] All wishlist rows after delete: ' . print_r($remaining, true));

echo json_encode(['success' => $success]);
?>