<?php
ob_start();
require_once '../cors.php';
require_once '../config/db.php';
require_once __DIR__ . '/../config/jwt_helper.php';

header('Content-Type: application/json');

$jwt_user = get_user_from_jwt();
$user_id = $jwt_user ? $jwt_user['sub'] : null;
// Guest logic
$guest_id = null;
if (!$user_id) {
    require_once __DIR__ . '/../config/guest_helper.php';
    $guest_id = get_guest_id();
}

if (!$user_id && !$guest_id) {
    ob_clean();
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

try {
    $query = "
        SELECT w.id, w.product_id, w.user_id, w.created_at, w.color_variation_id,
               p.id AS prod_id, p.name, p.price, p.image_url, p.description
        FROM wishlist w
        JOIN products p ON w.product_id = p.id
        WHERE ";
    
    if ($user_id) {
        $query .= "w.user_id = ?";
        $param = $user_id;
    } else {
        $query .= "w.guest_id = ?";
        $param = $guest_id;
    }

    $stmt = $pdo->prepare($query);
    $stmt->execute([$param]);

    $wishlist = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $img = ltrim($row['image_url'], '/\\');
        if (strpos($img, 'uploads/') === 0) {
            $img = substr($img, strlen('uploads/'));
        }
        $product_image_url = $row['image_url'] ? 'https://shopnest.example.com/backend/uploads/' . $img : '';

        // Fetch color variations for this product
        $stmt2 = $pdo->prepare('SELECT * FROM product_color_variations WHERE product_id = ? AND is_active = 1 ORDER BY id ASC');
        $stmt2->execute([$row['product_id']]);
        $color_variations = $stmt2->fetchAll(PDO::FETCH_ASSOC);
        foreach ($color_variations as &$variation) {
            // Fetch images for this color variation
            $stmt3 = $pdo->prepare('SELECT image_url FROM product_color_images WHERE color_variation_id = ? ORDER BY sort_order ASC');
            $stmt3->execute([$variation['id']]);
            $images = $stmt3->fetchAll(PDO::FETCH_COLUMN);
            $variation['images'] = [];
            foreach ($images as $img2) {
                $variation['images'][] = 'https://shopnest.example.com/backend/uploads/' . ltrim($img2, '/\\');
            }
        }
        // Find the selected color variant (by color_variation_id), or default to the first
        $selected_color_variant = null;
        if ($row['color_variation_id']) {
            foreach ($color_variations as $cv) {
                if ($cv['id'] == $row['color_variation_id']) {
                    $selected_color_variant = $cv;
                    break;
                }
            }
        }
        if (!$selected_color_variant && count($color_variations) > 0) {
            $selected_color_variant = $color_variations[0];
        }
        $wishlist[] = [
            'id' => (int)$row['id'],
            'productId' => (int)$row['product_id'],
            'userId' => (int)$row['user_id'],
            'colorVariationId' => isset($row['color_variation_id']) ? (int)$row['color_variation_id'] : null,
            'createdAt' => $row['created_at'],
            'product' => [
                'id' => (int)$row['prod_id'],
                'name' => $row['name'],
                'price' => $row['price'],
                'image_url' => $product_image_url,
                'description' => $row['description'],
                'color_variations' => $color_variations,
                'selected_color_variant' => $selected_color_variant
            ]
        ];
    }

    ob_clean();
    echo json_encode(['success' => true, 'data' => $wishlist]);
} catch (Exception $e) {
    ob_clean();
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}