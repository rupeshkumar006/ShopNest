<?php
require_once __DIR__ . '/../cors.php';
header('Content-Type: application/json; charset=UTF-8');
require_once '../config/db.php';
require_once '../config/encryption.php';

// Ensure unit columns exist (idempotent)
try { $pdo->exec("ALTER TABLE products ADD COLUMN unit_type ENUM('pieces','packets') NOT NULL DEFAULT 'pieces'"); } catch (Exception $e) {}
try { $pdo->exec("ALTER TABLE products ADD COLUMN packet_size INT NULL"); } catch (Exception $e) {}

function build_image_url($img) {
    $img = ltrim($img, '/\\');
    return 'https://shopnest.example.com/backend/uploads/' . $img;
}

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if (!$id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Product ID is required']);
    exit;
}

try {
    // Fetch product details
    $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
    $stmt->execute([$id]);
    $product = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$product) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Product not found']);
        exit;
    }
    
    // Handle main image URL
    $product['image_url'] = !empty($product['image_url']) ? build_image_url($product['image_url']) : build_image_url('default-image.png');
    
    // Fetch color variations
    $color_variations = [];
    try {
        $stmt2 = $pdo->prepare('SELECT * FROM product_color_variations WHERE product_id = ? AND is_active = 1 ORDER BY id ASC');
        $stmt2->execute([$id]);
        $color_variations = $stmt2->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($color_variations as &$variation) {
            // Fetch images for this color variation
            $stmt3 = $pdo->prepare('SELECT image_url FROM product_color_images WHERE color_variation_id = ? ORDER BY sort_order ASC');
            $stmt3->execute([$variation['id']]);
            $images = $stmt3->fetchAll(PDO::FETCH_COLUMN);
            
            $variation['images'] = [];
            foreach ($images as $img) {
                $variation['images'][] = build_image_url($img);
            }
        }
    } catch (Exception $e) {
        error_log("Error fetching variations: " . $e->getMessage());
    }

    $product['color_variations'] = $color_variations;
    $product['has_color_variations'] = count($color_variations) > 1 || (count($color_variations) === 1 && $color_variations[0]['color_name'] !== 'Default');
    
    // For single color, ensure gallery and image_url are set from product_color_images
    if (count($color_variations) === 1 && $color_variations[0]['color_name'] === 'Default') {
        $product['gallery'] = $color_variations[0]['images'];
        if (!empty($color_variations[0]['images'])) {
            $product['image_url'] = $color_variations[0]['images'][0];
        } else {
            $product['image_url'] = build_image_url('default-image.png');
        }
    }
    
    // Set default values for backward compatibility
    $product['price'] = !empty($color_variations) ? floatval($color_variations[0]['price']) : 0;
    if (!empty($color_variations)) {
        // Sum all color variant stocks for total product stock
        $product['stock'] = array_sum(array_map(function($v) { return intval($v['stock']); }, $color_variations));
    } // else leave as is for non-variant products
    $product['delivery_days'] = intval($product['delivery_days'] ?? 7);
    $product['material'] = $product['material'] ?? '';
    
    // For backward compatibility, set gallery to first color variation images
    if (!empty($color_variations) && !empty($color_variations[0]['images'])) {
        $product['gallery'] = $color_variations[0]['images'];
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
                return build_image_url($img);
            }, $gallery_imgs);
            if (empty($product['gallery'])) {
                $product['image_url'] = build_image_url('default-image.png');
            }
        } else {
            $product['gallery'] = [];
            $product['image_url'] = build_image_url('default-image.png');
        }
    }
    
    // Fetch reviews with user names
    // Fetch reviews with user names
    $reviews = [];
    $rating_data = ['average_rating' => null, 'review_count' => 0];

    try {
        $stmt6 = $pdo->prepare("
            SELECT pr.*, u.name as user_name 
            FROM product_reviews pr 
            LEFT JOIN users u ON pr.user_id = u.id 
            WHERE pr.product_id = ? 
            ORDER BY pr.created_at DESC
        ");
        $stmt6->execute([$id]);
        $reviews = $stmt6->fetchAll(PDO::FETCH_ASSOC);
        
        // Attach images to each review
        foreach ($reviews as &$review) {
            // Fetch and decrypt user name for each review
            if (!empty($review['user_id'])) {
                $stmtUser = $pdo->prepare('SELECT name FROM users WHERE id = ?');
                $stmtUser->execute([$review['user_id']]);
                $user = $stmtUser->fetch(PDO::FETCH_ASSOC);
                $review['user_name'] = $user && !empty($user['name']) ? robust_decrypt($user['name'], 'name') : 'Anonymous';
            } else {
                $review['user_name'] = 'Anonymous';
            }
            // Check for review images table existence before querying
            try {
                 $stmtImg = $pdo->prepare('SELECT image_url FROM product_review_images WHERE review_id = ?');
                 $stmtImg->execute([$review['id']]);
                 $review['images'] = $stmtImg->fetchAll(PDO::FETCH_COLUMN);
            } catch (Exception $e) {
                 $review['images'] = [];
            }
        }
        
        // Calculate average rating
        $stmt7 = $pdo->prepare("
            SELECT AVG(rating) as average_rating, COUNT(*) as review_count 
            FROM product_reviews 
            WHERE product_id = ?
        ");
        $stmt7->execute([$id]);
        $rating_data = $stmt7->fetch(PDO::FETCH_ASSOC);

    } catch (Exception $e) {
        error_log("Error fetching reviews: " . $e->getMessage());
    }
    
    $product['reviews'] = $reviews;
    $product['average_rating'] = $rating_data['average_rating'] ? round($rating_data['average_rating'], 1) : null;
    $product['review_count'] = intval($rating_data['review_count']);
    
    // Ensure numeric fields
    $product['id'] = intval($product['id']);
    
    // After fetching color variations and images
    if (!empty($color_variations)) {
        $product['gallery'] = $color_variations[0]['images'];
        if (!empty($color_variations[0]['images'])) {
            $product['image_url'] = $color_variations[0]['images'][0];
        }
        // Set default color variation id for frontend
        $product['default_color_variation_id'] = $color_variations[0]['id'];
    } else {
        $product['gallery'] = [];
    }
    
    echo json_encode(['success' => true, 'data' => $product]);
    
} catch (Exception $e) {
    error_log('Error fetching product: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to fetch product']);
}
?>
