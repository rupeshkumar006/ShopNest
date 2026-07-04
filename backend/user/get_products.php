<?php
require_once '../cors.php';
require_once '../config/db.php';

function build_image_url($img) {
    $img = ltrim($img, '/\\');
    return 'https://shopnest.example.com/backend/uploads/' . $img;
}

// Add deleted column to products if it doesn't exist
try {
    $pdo->exec('ALTER TABLE products ADD COLUMN deleted TINYINT(1) DEFAULT 0');
} catch (PDOException $e) {
    // Column already exists, ignore
}

try {
    $stmt = $pdo->query("SELECT * FROM products WHERE deleted = 0 OR deleted IS NULL ORDER BY created_at DESC");
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($products as &$product) {
        // Main image
        $product['image_url'] = !empty($product['image_url']) ? build_image_url($product['image_url']) : build_image_url('default-image.png');
        
        // Fetch color variations
        $color_variations = [];
        try {
            $stmt2 = $pdo->prepare('SELECT * FROM product_color_variations WHERE product_id = ? AND is_active = 1 ORDER BY id ASC');
            $stmt2->execute([$product['id']]);
            $color_variations = $stmt2->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($color_variations as &$variation) {
                // Fetch images for this color variation
                $stmt3 = $pdo->prepare('SELECT image_url FROM product_color_images WHERE color_variation_id = ? ORDER BY sort_order ASC');
                $stmt3->execute([$variation['id']]);
                $images = $stmt3->fetchAll(PDO::FETCH_COLUMN);
                
                $variation['images'] = [];
                foreach ($images as $img) {
                    $img_url = build_image_url($img);
                    $variation['images'][] = $img_url;
                }
            }
        } catch (Exception $e) {
            // Table might not exist or other error; treat as no variations
            error_log('Error fetching variations for product ' . $product['id'] . ': ' . $e->getMessage());
        }
        
        $product['color_variations'] = $color_variations;
        // Ensure unit fields exist in payload
        if (empty($product['unit_type'])) { $product['unit_type'] = 'pieces'; }
        if ($product['unit_type'] !== 'packets') { $product['packet_size'] = null; }
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
        if (!empty($color_variations)) {
            $product['price'] = floatval($color_variations[0]['price']);
            $product['stock'] = intval($color_variations[0]['stock']);
        } else {
             // Fallback to product table's price/stock
            $product['price'] = floatval($product['price'] ?? 0);
            $product['stock'] = intval($product['stock'] ?? 0);
        }
        $product['delivery_days'] = intval($product['delivery_days'] ?? 7);
        $product['id'] = intval($product['id']);
        
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
    }
    echo json_encode(['success' => true, 'data' => $products]);
} catch (Exception $e) {
    error_log('Error fetching products: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to fetch products']);
}
?>