<?php
require_once __DIR__ . '/../cors.php';
require_once '../config/db.php';
require_once __DIR__ . '/../config/jwt_helper.php';
header('Content-Type: application/json; charset=UTF-8');

$jwt_user = get_user_from_jwt();
if (!$jwt_user || empty($jwt_user['sub'])) {
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}
$user_id = $jwt_user['sub'];

// Accept both JSON and multipart/form-data
if (strpos($_SERVER['CONTENT_TYPE'], 'multipart/form-data') !== false) {
    $product_id = isset($_POST['product_id']) ? intval($_POST['product_id']) : 0;
    $rating = isset($_POST['rating']) ? intval($_POST['rating']) : 0;
    $review = isset($_POST['review']) ? trim($_POST['review']) : '';
} else {
    $input = json_decode(file_get_contents('php://input'), true);
    $product_id = isset($input['product_id']) ? intval($input['product_id']) : 0;
    $rating = isset($input['rating']) ? intval($input['rating']) : 0;
    $review = isset($input['review']) ? trim($input['review']) : '';
}

if (!$product_id || $rating < 1 || $rating > 5 || strlen($review) < 5) {
    echo json_encode(['success' => false, 'error' => 'Invalid input']);
    exit;
}

try {
    // First, check if the product exists
    $stmt = $pdo->prepare('SELECT id FROM products WHERE id = ?');
    $stmt->execute([$product_id]);
    if (!$stmt->fetch()) {
        echo json_encode(['success' => false, 'error' => 'Product not found']);
        exit;
    }
    
    // Check if user has already reviewed this product
    $stmt = $pdo->prepare('SELECT id FROM product_reviews WHERE product_id = ? AND user_id = ?');
    $stmt->execute([$product_id, $user_id]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'error' => 'You have already reviewed this product']);
        exit;
    }
    
    $stmt = $pdo->prepare('INSERT INTO product_reviews (product_id, user_id, rating, review, created_at) VALUES (?, ?, ?, ?, NOW())');
    $stmt->execute([$product_id, $user_id, $rating, $review]);
    $review_id = $pdo->lastInsertId();
    
    // Log successful review submission
    error_log("Review submitted successfully - ID: $review_id, Product: $product_id, User: $user_id, Rating: $rating");
    
    // Handle multiple images if present
    if (!empty($_FILES['images'])) {
        $total = count($_FILES['images']['name']);
        for ($i = 0; $i < $total; $i++) {
            $tmpFilePath = $_FILES['images']['tmp_name'][$i];
            if ($tmpFilePath != "") {
                $newFileName = uniqid() . '_' . basename($_FILES['images']['name'][$i]);
                $uploadPath = __DIR__ . '/../uploads/review_images/' . $newFileName;
                move_uploaded_file($tmpFilePath, $uploadPath);
                $imageUrl = '/backend/uploads/review_images/' . $newFileName;
                $stmtImg = $pdo->prepare("INSERT INTO product_review_images (review_id, image_url) VALUES (?, ?)");
                $stmtImg->execute([$review_id, $imageUrl]);
            }
        }
    }
    
    echo json_encode(['success' => true, 'message' => 'Review submitted']);
} catch (Exception $e) {
    error_log("Error submitting review: " . $e->getMessage());
    
    // Provide more specific error messages based on the error
    if (strpos($e->getMessage(), 'Integrity constraint violation') !== false) {
        if (strpos($e->getMessage(), 'product_id') !== false) {
            echo json_encode(['success' => false, 'error' => 'Invalid product ID']);
        } else {
            echo json_encode(['success' => false, 'error' => 'Database constraint violation']);
        }
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to submit review: ' . $e->getMessage()]);
    }
} 