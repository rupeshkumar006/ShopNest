<?php
header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt_helper.php';

$jwt_user = get_user_from_jwt();
if (!$jwt_user || empty($jwt_user['admin']) || !$jwt_user['admin']) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Admin access required']);
    exit;
}

// Ensure column exists
try {
    $pdo->exec("ALTER TABLE products ADD COLUMN is_featured TINYINT(1) DEFAULT 0");
} catch (Exception $e) {
    // Column likely exists
}

// Accept JSON POST
if (isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'application/json') === 0) {
    $input = json_decode(file_get_contents('php://input'), true);
} else {
    $input = $_POST;
}

$product_id = isset($input['product_id']) ? intval($input['product_id']) : 0;
$is_featured = isset($input['is_featured']) ? (bool)$input['is_featured'] : false;

if ($product_id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid product ID']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE products SET is_featured = ? WHERE id = ?");
    $stmt->execute([$is_featured ? 1 : 0, $product_id]);

    echo json_encode([
        'success' => true,
        'message' => 'Product featured status updated',
        'is_featured' => $is_featured
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
?>
