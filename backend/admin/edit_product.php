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

$id = isset($input['id']) ? intval($input['id']) : 0;
$name = isset($input['name']) ? trim($input['name']) : '';
$description = isset($input['description']) ? trim($input['description']) : '';
$category = isset($input['category']) ? trim($input['category']) : '';
$delivery_days = isset($input['delivery_days']) ? intval($input['delivery_days']) : 7;
$has_color_variations = isset($input['has_color_variations']) && ($input['has_color_variations'] === true || $input['has_color_variations'] === 1 || $input['has_color_variations'] === '1');
// Units
$unit_type = isset($input['unit_type']) ? strtolower(trim($input['unit_type'])) : null;
$packet_size = isset($input['packet_size']) ? intval($input['packet_size']) : null;

if (empty($id) || empty($name)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'ID and name are required']);
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

// Ensure columns exist (idempotent)
try { $pdo->exec("ALTER TABLE products ADD COLUMN unit_type ENUM('pieces','packets') NOT NULL DEFAULT 'pieces'"); } catch (Exception $e) {}
try { $pdo->exec("ALTER TABLE products ADD COLUMN packet_size INT NULL"); } catch (Exception $e) {}
try { $pdo->exec("ALTER TABLE products ADD COLUMN material VARCHAR(255) NULL"); } catch (Exception $e) {}

try {
    $pdo->beginTransaction();
    
    // Fetch existing product data
    $stmt = $pdo->prepare('SELECT image_url FROM products WHERE id = ?');
    $stmt->execute([$id]);
    $product = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$product) {
        throw new Exception('Product not found');
    }
    
    $image_url = $product['image_url'];
    
    $material = isset($input['material']) ? trim($input['material']) : '';

    // Validate units if provided; keep existing if nulls
    if ($unit_type !== null && !in_array($unit_type, ['pieces','packets'])) {
        throw new Exception('unit_type must be either pieces or packets');
    }
    if ($unit_type === 'packets') {
        if (empty($packet_size) || $packet_size < 1) {
            throw new Exception('packet_size must be a positive integer for packet-based products');
        }
    }
    if ($unit_type === 'pieces') {
        $packet_size = null;
    }

    // Update main product
    if ($unit_type === null) {
        $stmt = $pdo->prepare('UPDATE products SET name = ?, description = ?, category = ?, delivery_days = ?, material = ? WHERE id = ?');
        $stmt->execute([$name, $description, $category, $delivery_days, $material, $id]);
    } else {
        $stmt = $pdo->prepare('UPDATE products SET name = ?, description = ?, category = ?, delivery_days = ?, unit_type = ?, packet_size = ?, material = ? WHERE id = ?');
        $stmt->execute([$name, $description, $category, $delivery_days, $unit_type, $packet_size, $material, $id]);
    }
    
    // Instead of deleting all color variations and images, fetch existing ones
    $stmt = $pdo->prepare('SELECT id FROM product_color_variations WHERE product_id = ?');
    $stmt->execute([$id]);
    $existing_variation_ids = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if ($has_color_variations) {
        $color_variations = isset($input['color_variations']) ? $input['color_variations'] : [];
        if (is_string($color_variations)) {
            $color_variations = json_decode($color_variations, true);
        }
        if (empty($color_variations) || !is_array($color_variations)) {
            throw new Exception('At least one color variation is required when has_color_variations is true');
        }
        
        // Debug: Log what we received
        error_log('Color variations received: ' . json_encode($color_variations));
        error_log('Files received: ' . json_encode(array_keys($_FILES)));
        
        $input_variation_ids = array_filter(array_column($color_variations, 'id'));

        // Find variations to delete
        $to_delete = array_diff($existing_variation_ids, $input_variation_ids);
        foreach ($to_delete as $del_id) {
            $stmt = $pdo->prepare('DELETE FROM product_color_images WHERE color_variation_id = ?');
            $stmt->execute([$del_id]);
            $stmt = $pdo->prepare('DELETE FROM product_color_variations WHERE id = ?');
            $stmt->execute([$del_id]);
        }

        // Update or insert variations
        foreach ($color_variations as $idx => $variation) {
            $color_name = $variation['color_name'] ?? '';
            $hex_code = $variation['hex_code'] ?? '';
            $price = floatval($variation['price'] ?? 0);
            $stock = intval($variation['stock'] ?? 0);
            $var_id = $variation['id'] ?? null;
            $is_new = false;
            // Check if this is a new variation (negative ID) or existing one
            if ($var_id && $var_id > 0 && in_array($var_id, $existing_variation_ids)) {
                // Update existing variation
                error_log("Updating color variation: id=$var_id, name=$color_name, hex=$hex_code, price=$price, stock=$stock");
                $stmt = $pdo->prepare('UPDATE product_color_variations SET color_name=?, hex_code=?, price=?, stock=? WHERE id=?');
                $stmt->execute([$color_name, $hex_code, $price, $stock, $var_id]);
            } else {
                // Insert new variation (negative ID or not in existing list)
                error_log("Inserting new color variation for product_id=$id, name=$color_name, hex=$hex_code, price=$price, stock=$stock");
                $stmt = $pdo->prepare('INSERT INTO product_color_variations (product_id, color_name, hex_code, price, stock) VALUES (?, ?, ?, ?, ?)');
                $result = $stmt->execute([$id, $color_name, $hex_code, $price, $stock]);
                error_log("Insert result: " . var_export($result, true));
                $var_id = $pdo->lastInsertId();
                error_log("New color variation ID: $var_id");
                $is_new = true;
            }
            // Handle images for this color variation
            $stmt = $pdo->prepare('SELECT image_url FROM product_color_images WHERE color_variation_id = ?');
            $stmt->execute([$var_id]);
            $existing_images = $stmt->fetchAll(PDO::FETCH_COLUMN);
            $input_images = isset($variation['images']) && is_array($variation['images']) ? $variation['images'] : $existing_images;
            $input_images_filenames = array_map(function($img) {
                return basename($img);
            }, $input_images);
            $to_delete_imgs = array_diff($existing_images, $input_images_filenames);
            foreach ($to_delete_imgs as $img) {
                error_log("Deleting image for color_variation_id=$var_id: $img");
                $stmt = $pdo->prepare('DELETE FROM product_color_images WHERE color_variation_id = ? AND image_url = ?');
                $stmt->execute([$var_id, $img]);
            }
            // Add new images from file uploads (always use $idx as key)
            error_log("Checking for uploaded files for color_images_{$idx}");
            error_log("_FILES for color_images_{$idx}: " . json_encode(isset($_FILES["color_images_{$idx}"]) ? $_FILES["color_images_{$idx}"] : null));
            if (isset($_FILES["color_images_{$idx}"]) && is_array($_FILES["color_images_{$idx}"]['name'])) {
                $uploadDir = dirname(__DIR__, 2) . '/backend/uploads/';
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }
                foreach ($_FILES["color_images_{$idx}"]['name'] as $imgIdx => $imgName) {
                    error_log("Processing uploaded file: $imgName for color_variation_id=$var_id");
                    if ($_FILES["color_images_{$idx}"]['error'][$imgIdx] === UPLOAD_ERR_OK) {
                        $filename = uniqid() . '_' . basename($imgName);
                        $target_file = $uploadDir . $filename;
                        $allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                        $file_type = $_FILES["color_images_{$idx}"]['type'][$imgIdx];
                        if (in_array($file_type, $allowed_types) && move_uploaded_file($_FILES["color_images_{$idx}"]['tmp_name'][$imgIdx], $target_file)) {
                            error_log("Inserting image for color_variation_id=$var_id: $filename");
                            $stmt = $pdo->prepare('INSERT INTO product_color_images (color_variation_id, image_url, sort_order) VALUES (?, ?, ?)');
                            $stmt->execute([$var_id, $filename, count($input_images) + $imgIdx]);
                        } else {
                            error_log("Failed to move uploaded file or invalid type: $imgName");
                        }
                    } else {
                        error_log("Upload error for file $imgName: " . $_FILES["color_images_{$idx}"]['error'][$imgIdx]);
                    }
                }
            }
            // Update sort order for existing images
            foreach ($input_images as $imgIdx => $img) {
                if (in_array($img, $existing_images)) {
                    $stmt = $pdo->prepare('UPDATE product_color_images SET sort_order=? WHERE color_variation_id=? AND image_url=?');
                    $stmt->execute([$imgIdx, $var_id, $img]);
                }
            }
        }
        
        // Update main product with first color variation's first image
        $stmt = $pdo->prepare('SELECT pcv.id FROM product_color_variations pcv WHERE pcv.product_id = ? ORDER BY pcv.id ASC LIMIT 1');
        $stmt->execute([$id]);
        $first_var_id = $stmt->fetchColumn();
        if ($first_var_id) {
            $stmt = $pdo->prepare('SELECT image_url FROM product_color_images WHERE color_variation_id = ? ORDER BY sort_order ASC LIMIT 1');
            $stmt->execute([$first_var_id]);
            $main_img = $stmt->fetchColumn();
            if ($main_img) {
                $stmt = $pdo->prepare('UPDATE products SET image_url = ? WHERE id = ?');
                $stmt->execute([$main_img, $id]);
            }
        }
    } else {
        // For single-color products
        $price = floatval($input['price'] ?? 0);
        $stock = intval($input['stock'] ?? 0);
        
        // Update price and stock in main products table
        $stmt = $pdo->prepare('UPDATE products SET price = ?, stock = ? WHERE id = ?');
        $stmt->execute([$price, $stock, $id]);
        
        // Fetch existing color variation for this product
        $stmt = $pdo->prepare('SELECT id FROM product_color_variations WHERE product_id = ? LIMIT 1');
        $stmt->execute([$id]);
        $default_var_id = $stmt->fetchColumn();
        
        if (!$default_var_id) {
            // Create default color variation if none exists
            $stmt = $pdo->prepare('INSERT INTO product_color_variations (product_id, color_name, hex_code, price, stock) VALUES (?, ?, ?, ?, ?)');
            $stmt->execute([$id, 'Default', '#000000', $price, $stock]);
            $default_var_id = $pdo->lastInsertId();
        } else {
            // Update existing default variation
            $stmt = $pdo->prepare('UPDATE product_color_variations SET price = ?, stock = ? WHERE id = ?');
            $stmt->execute([$price, $stock, $default_var_id]);
        }
        
        // Handle images for single-color product
        $stmt = $pdo->prepare('SELECT image_url FROM product_color_images WHERE color_variation_id = ?');
        $stmt->execute([$default_var_id]);
        $existing_images = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $input_images = isset($_POST['existing_images']) && is_array($_POST['existing_images']) ? $_POST['existing_images'] : $existing_images;
        $input_images_filenames = array_map(function($img) {
            return basename($img);
        }, $input_images);
        $to_delete_imgs = array_diff($existing_images, $input_images_filenames);
        foreach ($to_delete_imgs as $img) {
            $stmt = $pdo->prepare('DELETE FROM product_color_images WHERE color_variation_id = ? AND image_url = ?');
            $stmt->execute([$default_var_id, $img]);
        }
        
        // Add new images from file uploads
        if (isset($_FILES['images']) && is_array($_FILES['images']['name'])) {
            $uploadDir = dirname(__DIR__, 2) . '/backend/uploads/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            foreach ($_FILES['images']['name'] as $idx => $imgName) {
                if ($_FILES['images']['error'][$idx] === UPLOAD_ERR_OK) {
                    $filename = uniqid() . '_' . basename($imgName);
                    $target_file = $uploadDir . $filename;
                    $allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                    $file_type = $_FILES['images']['type'][$idx];
                    if (in_array($file_type, $allowed_types) && move_uploaded_file($_FILES['images']['tmp_name'][$idx], $target_file)) {
                        $stmt = $pdo->prepare('INSERT INTO product_color_images (color_variation_id, image_url, sort_order) VALUES (?, ?, ?)');
                        $stmt->execute([$default_var_id, $filename, count($input_images) + $idx]);
                    }
                }
            }
        }
        
        // Update main product with first image
        $stmt = $pdo->prepare('SELECT image_url FROM product_color_images WHERE color_variation_id = ? ORDER BY sort_order ASC LIMIT 1');
        $stmt->execute([$default_var_id]);
        $main_img = $stmt->fetchColumn();
        if ($main_img) {
            $stmt = $pdo->prepare('UPDATE products SET image_url = ? WHERE id = ?');
            $stmt->execute([$main_img, $id]);
        }
    }
    
    $pdo->commit();
    
    echo json_encode([
        'success' => true, 
        'message' => 'Product updated successfully',
        'product_id' => $id
    ]);
    
} catch (Exception $e) {
    $pdo->rollBack();
    error_log('Error updating product: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to update product: ' . $e->getMessage()]);
}
?>