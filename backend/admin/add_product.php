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

// Accept JSON POST
if (isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'application/json') === 0) {
    $input = json_decode(file_get_contents('php://input'), true);
    if (is_array($input)) {
        $_POST = $input;
    }
}
$input = $_POST;

$name = isset($input['name']) ? trim($input['name']) : '';
$description = isset($input['description']) ? trim($input['description']) : '';
$category = isset($input['category']) ? trim($input['category']) : '';
$delivery_days = isset($input['delivery_days']) ? intval($input['delivery_days']) : 7;
$has_color_variations = isset($input['has_color_variations']) && ($input['has_color_variations'] === true || $input['has_color_variations'] === 1 || $input['has_color_variations'] === '1');
// Units: pieces or packets; when packets, require packet_size
$unit_type = isset($input['unit_type']) ? strtolower(trim($input['unit_type'])) : 'pieces';
$packet_size = isset($input['packet_size']) ? intval($input['packet_size']) : null;

// Defensive: If has_color_variations is false, ignore color_variations in input
if (!$has_color_variations && isset($input['color_variations'])) {
    unset($input['color_variations']);
}

if (empty($name)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Name is required']);
    exit();
}

if (empty($description)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Description is required']);
    exit();
}

if (empty($category)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Category is required']);
    exit();
}

if ($delivery_days < 1) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Delivery days must be at least 1']);
    exit();
}

// Validate unit fields
if (!in_array($unit_type, ['pieces', 'packets'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'unit_type must be either pieces or packets']);
    exit();
}
if ($unit_type === 'packets') {
    if (empty($packet_size) || $packet_size < 1) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'packet_size must be a positive integer for packet-based products']);
        exit();
    }
} else {
    $packet_size = null; // normalize
}

// Ensure new columns exist (idempotent)
try { $pdo->exec("ALTER TABLE products ADD COLUMN unit_type ENUM('pieces','packets') NOT NULL DEFAULT 'pieces'"); } catch (Exception $e) {}
try { $pdo->exec("ALTER TABLE products ADD COLUMN packet_size INT NULL"); } catch (Exception $e) {}
try { $pdo->exec("ALTER TABLE products ADD COLUMN material VARCHAR(255) NULL"); } catch (Exception $e) {}

try {
    $pdo->beginTransaction();
    
    $material = isset($input['material']) ? trim($input['material']) : '';
    $base_price = isset($input['price']) ? floatval($input['price']) : 0;
    $base_stock = isset($input['stock']) ? intval($input['stock']) : 0;

    // Insert main product
    $stmt = $pdo->prepare('INSERT INTO products (name, description, category, delivery_days, unit_type, packet_size, price, stock, material) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([$name, $description, $category, $delivery_days, $unit_type, $packet_size, $base_price, $base_stock, $material]);
    $product_id = $pdo->lastInsertId();

    if ($has_color_variations) {
        // Handle color variations
        $color_variations = isset($input['color_variations']) ? $input['color_variations'] : [];
        if (is_string($color_variations)) {
            $decoded = json_decode($color_variations, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $color_variations = $decoded;
            } else {
                throw new Exception('Invalid color_variations data');
            }
        }
        if (!is_array($color_variations) || empty($color_variations)) {
            throw new Exception('At least one color variation is required when has_color_variations is true');
        }
        foreach ($color_variations as $idx => $variation) {
            $color_name = $variation['color_name'] ?? '';
            $hex_code = $variation['hex_code'] ?? '';
            $price = floatval($variation['price'] ?? 0);
            $stock = intval($variation['stock'] ?? 0);
            if (empty($color_name)) {
                throw new Exception('Color name is required for all variations');
            }
            if (empty($hex_code) || !preg_match('/^#[0-9A-Fa-f]{6}$/', $hex_code)) {
                throw new Exception('Valid hex color code is required for all variations');
            }
            if ($price <= 0) {
                throw new Exception('Valid price is required for all variations');
            }
            if ($stock < 0) {
                throw new Exception('Stock cannot be negative');
            }
            // Insert color variation
            $stmt = $pdo->prepare('INSERT INTO product_color_variations (product_id, color_name, hex_code, price, stock) VALUES (?, ?, ?, ?, ?)');
            $stmt->execute([$product_id, $color_name, $hex_code, $price, $stock]);
            $color_variation_id = $pdo->lastInsertId();
            // Handle images for this color variation
            $uploadDir = dirname(__DIR__, 2) . '/backend/uploads/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            $final_images = [];
            // Existing images (from frontend)
            $existing_images_key = 'existing_images_' . $idx;
            $existing_images = isset($_POST[$existing_images_key]) ? (array)$_POST[$existing_images_key] : [];
            foreach ($existing_images as $img) {
                if (!empty($img)) $final_images[] = $img;
            }
            // New uploads
            $file_key = 'color_images_' . $idx;
            if (isset($_FILES[$file_key]) && is_array($_FILES[$file_key]['name'])) {
                foreach ($_FILES[$file_key]['name'] as $fidx => $imgName) {
                    if ($_FILES[$file_key]['error'][$fidx] === UPLOAD_ERR_OK) {
                        $filename = uniqid() . '_' . basename($imgName);
                        $target_file = $uploadDir . $filename;
                        $allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                        $file_type = $_FILES[$file_key]['type'][$fidx];
                        if (in_array($file_type, $allowed_types) && move_uploaded_file($_FILES[$file_key]['tmp_name'][$fidx], $target_file)) {
                            $final_images[] = $filename;
                        }
                    }
                }
            }
            // Save images to DB
            foreach ($final_images as $img_idx => $filename) {
                $stmt = $pdo->prepare('INSERT INTO product_color_images (color_variation_id, image_url, sort_order) VALUES (?, ?, ?)');
                $stmt->execute([$color_variation_id, $filename, $img_idx]);
            }
            // For each color variation, after saving images, update the product's image_url with the first image of the first color variation
            if ($idx === 0 && !empty($final_images)) {
                $stmt = $pdo->prepare('UPDATE products SET image_url = ? WHERE id = ?');
                $stmt->execute([$final_images[0], $product_id]);
            }
        }
    } else {
        // Handle single color product
        $price = isset($input['price']) ? floatval($input['price']) : 0;
        $stock = isset($input['stock']) ? intval($input['stock']) : 0;
        if ($price <= 0) {
            throw new Exception('Valid price is required for single color products');
        }
        if ($stock < 0) {
            throw new Exception('Stock cannot be negative');
        }
        // Create a default color variation for single color products
        $stmt = $pdo->prepare('INSERT INTO product_color_variations (product_id, color_name, hex_code, price, stock) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$product_id, 'Default', '#000000', $price, $stock]);
        $color_variation_id = $pdo->lastInsertId();
        $uploadDir = dirname(__DIR__, 2) . '/backend/uploads/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        $final_images = [];
        // Existing images (from frontend)
        $existing_images = isset($_POST['existing_images']) ? (array)$_POST['existing_images'] : [];
        foreach ($existing_images as $img) {
            if (!empty($img)) $final_images[] = $img;
        }
        // New uploads
        if (isset($_FILES['images']) && is_array($_FILES['images']['name'])) {
            foreach ($_FILES['images']['name'] as $idx => $imgName) {
                if ($_FILES['images']['error'][$idx] === UPLOAD_ERR_OK) {
                    $filename = uniqid() . '_' . basename($imgName);
                    $target_file = $uploadDir . $filename;
                    $allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                    $file_type = $_FILES['images']['type'][$idx];
                    if (in_array($file_type, $allowed_types) && move_uploaded_file($_FILES['images']['tmp_name'][$idx], $target_file)) {
                        $final_images[] = $filename;
                    }
                }
            }
        }
        // Save images to DB
        foreach ($final_images as $img_idx => $filename) {
            $stmt = $pdo->prepare('INSERT INTO product_color_images (color_variation_id, image_url, sort_order) VALUES (?, ?, ?)');
            $stmt->execute([$color_variation_id, $filename, $img_idx]);
        }
        // After saving images for single color, update product's image_url
        if (!empty($final_images)) {
            $stmt = $pdo->prepare('UPDATE products SET image_url = ? WHERE id = ?');
            $stmt->execute([$final_images[0], $product_id]);
        }
    }

    $pdo->commit();
    
    echo json_encode([
        'success' => true, 
        'message' => 'Product added successfully',
        'product_id' => $product_id
    ]);
    
} catch (Exception $e) {
    $pdo->rollBack();
    error_log('Error adding product: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to add product: ' . $e->getMessage()]);
}
?>