<?php
header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt_helper.php';
require_once __DIR__ . '/../config/encryption.php';
require_once __DIR__ . '/../utils/send_email.php';
require_once __DIR__ . '/../vendor/autoload.php';

$jwt_user = get_user_from_jwt();
if (!$jwt_user || empty($jwt_user['admin']) || !$jwt_user['admin']) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit();
}

// Handle both JSON and FormData
$product_id = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $content_type = $_SERVER['CONTENT_TYPE'] ?? '';
    
    if (strpos($content_type, 'application/json') !== false) {
        $input = json_decode(file_get_contents('php://input'), true);
        $product_id = $input['id'] ?? null;
    } else {
        // Handle FormData
        $product_id = $_POST['id'] ?? null;
    }
}

if (!$product_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Product ID is required']);
    exit();
}

try {
    // First, check if the product exists
    $stmt = $pdo->prepare('SELECT * FROM products WHERE id = ?');
    $stmt->execute([$product_id]);
    $product = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$product) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Product not found']);
        exit();
    }
    
    // Soft delete: add deleted column if it doesn't exist, then set deleted = 1
    try {
        $pdo->exec('ALTER TABLE products ADD COLUMN deleted TINYINT(1) DEFAULT 0');
    } catch (PDOException $e) {
        // Column already exists, ignore
    }
    
    // Soft delete instead of hard delete
    $stmt = $pdo->prepare('UPDATE products SET deleted = 1 WHERE id = ?');
    $stmt->execute([$product_id]);
    
    echo json_encode(['success' => true, 'message' => 'Product deleted successfully']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to delete product: ' . $e->getMessage()]);
}
?>