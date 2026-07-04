<?php
header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../config/jwt_helper.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/encryption.php';
require_once __DIR__ . '/../vendor/autoload.php';

$jwt_user = get_user_from_jwt();
if (!$jwt_user || empty($jwt_user['admin']) || !$jwt_user['admin']) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit();
}

// Add deleted column to products if it doesn't exist
try {
    $pdo->exec('ALTER TABLE products ADD COLUMN deleted TINYINT(1) DEFAULT 0');
} catch (PDOException $e) {}

// Add is_featured column to products if it doesn't exist
try {
    $pdo->exec("ALTER TABLE products ADD COLUMN is_featured TINYINT(1) DEFAULT 0");
} catch (PDOException $e) {}

$stmt = $pdo->query("SELECT * FROM products WHERE deleted = 0 OR deleted IS NULL");
$products = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($products as &$product) {
    // Normalize image URL
    if (!empty($product['image_url'])) {
        $img = ltrim($product['image_url'], '/\\');
        if (strpos($img, 'uploads/') === 0) {
            $img = substr($img, strlen('uploads/'));
        }
        $product['image_url'] = 'https://shopnest.example.com/backend/uploads/' . $img;
    }
    // Fetch color variations for this product
    $stmt = $pdo->prepare("SELECT * FROM product_color_variations WHERE product_id = ?");
    $stmt->execute([$product['id']]);
    $color_variations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($color_variations as &$variation) {
        // Fetch images for this color variation
        $stmt = $pdo->prepare("SELECT image_url FROM product_color_images WHERE color_variation_id = ? ORDER BY sort_order ASC");
        $stmt->execute([$variation['id']]);
        $variation['images'] = array_map(function($row) {
            return 'https://shopnest.example.com/backend/uploads/' . $row['image_url'];
        }, $stmt->fetchAll(PDO::FETCH_ASSOC));
    }
    $product['color_variations'] = $color_variations;
    $product['has_color_variations'] = count($color_variations) > 1 || (count($color_variations) === 1 && $color_variations[0]['color_name'] !== 'Default');
    
    // For single color, ensure gallery and image_url are set from product_color_images
    if (count($color_variations) === 1 && $color_variations[0]['color_name'] === 'Default') {
        $product['gallery'] = $color_variations[0]['images'];
        if (!empty($color_variations[0]['images'])) {
            $product['image_url'] = $color_variations[0]['images'][0];
        }
    }
    
    // Set default values for backward compatibility
    if (!empty($color_variations)) {
        $product['price'] = floatval($color_variations[0]['price']);
        $product['stock'] = intval($color_variations[0]['stock']);
    } else {
        $product['price'] = floatval($product['price'] ?? 0);
        $product['stock'] = intval($product['stock'] ?? 0);
    }
    $product['delivery_days'] = intval($product['delivery_days'] ?? 7);
    $product['material'] = $product['material'] ?? '';
    // Set gallery for both single and multi-color products
    if (!empty($color_variations) && !empty($color_variations[0]['images'])) {
        $product['gallery'] = $color_variations[0]['images'];
        if (!empty($color_variations[0]['images'])) {
            $product['image_url'] = $color_variations[0]['images'][0];
        }
        // Set default color variation id for frontend
        $product['default_color_variation_id'] = $color_variations[0]['id'];
    } else {
        // fallback: try to get images from product_color_images for the default color variation
        $stmt4 = $pdo->prepare('SELECT id FROM product_color_variations WHERE product_id = ? ORDER BY id ASC LIMIT 1');
        $stmt4->execute([$product['id']]);
        $default_variation_id = $stmt4->fetchColumn();
        if ($default_variation_id) {
            $stmt5 = $pdo->prepare('SELECT image_url FROM product_color_images WHERE color_variation_id = ? ORDER BY sort_order ASC');
            $stmt5->execute([$default_variation_id]);
            $gallery_imgs = $stmt5->fetchAll(PDO::FETCH_COLUMN);
            $product['gallery'] = array_map(function($img) {
                return 'https://shopnest.example.com/backend/uploads/' . ltrim($img, '/\\');
            }, $gallery_imgs);
        } else {
            $product['gallery'] = [];
        }
    }
}

echo json_encode([
    'success' => true,
    'data' => $products
]);
?>