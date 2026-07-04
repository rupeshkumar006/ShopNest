<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log'); // Ensure error logging is enabled

error_log("add_to_cart.php script started");

require_once __DIR__ . '/../cors.php';
error_log("cors.php required");
require_once __DIR__ . '/../config/db.php';
error_log("db.php required");
require_once __DIR__ . '/../config/jwt_helper.php'; // Ensure this includes get_user_from_jwt
error_log("jwt_helper.php required");
require_once __DIR__ . '/../config/encryption.php';
require_once __DIR__ . '/../vendor/autoload.php';


header('Content-Type: application/json');

// Get the request body
$raw_input = file_get_contents('php://input');
error_log("Raw input: " . $raw_input);

$input = json_decode($raw_input, true);
error_log("Decoding JSON input");

// Explicitly cast input to array for safety
$input = (array) $input;
error_log("Casted input to array");


$product_id = isset($input['product_id']) ? intval($input['product_id']) : 0;
$color_variation_id = isset($input['color_variation_id']) ? intval($input['color_variation_id']) : null;
// If color_variation_id is null, fetch the default color variation for this product
if ($color_variation_id === null) {
    $stmt = $pdo->prepare('SELECT id FROM product_color_variations WHERE product_id = ? ORDER BY id ASC LIMIT 1');
    $stmt->execute([$product_id]);
    $color_variation_id = $stmt->fetchColumn();
    // Always set this as default if not provided
}
// Default quantity to 1 if not provided or invalid
$quantity = (isset($input['quantity']) && is_numeric($input['quantity']) && $input['quantity'] > 0) ? intval($input['quantity']) : 1;

error_log("Extracted product_id: " . $product_id . ", color_variation_id: " . $color_variation_id . ", quantity: " . $quantity);

// Get user data from JWT (should return an array based on jwt_helper.php fix)
$jwt_user = get_user_from_jwt();
error_log("JWT user data obtained: " . print_r($jwt_user, true));

// Access user ID using array syntax, assuming 'sub' key from JWT payload
$user_id = isset($jwt_user['sub']) ? $jwt_user['sub'] : null;

// Guest logic
$guest_id = null;
if (!$user_id) {
    require_once __DIR__ . '/../config/guest_helper.php';
    $guest_id = get_guest_id();
    error_log("Guest ID obtained: " . $guest_id);
}

error_log("Extracted user_id from JWT: " . $user_id . ", Guest ID: " . $guest_id);

// Validate user and product ID (Accept either user_id OR guest_id)
if ((!$user_id && !$guest_id) || $product_id <= 0) {
    error_log("Validation failed: Invalid user_id/guest_id or product_id");
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'error' => ['message' => 'Invalid user or product ID']]);
    exit;
}

try {
    error_log("Inside try block for database operations");
    // Start transaction for atomicity
    $pdo->beginTransaction();
    error_log("Transaction started");

    // Check stock for product or color variation
    $stock = 0;
    if ($color_variation_id) {
        $stmt = $pdo->prepare('SELECT stock FROM product_color_variations WHERE id = ? AND product_id = ?');
        $stmt->execute([$color_variation_id, $product_id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $stock = intval($row['stock']);
        } else {
            $pdo->rollBack();
            echo json_encode(['success' => false, 'error' => ['message' => 'Color variation not found']]);
            exit;
        }
    } else {
        $stmt = $pdo->prepare('SELECT stock FROM products WHERE id = ?');
        $stmt->execute([$product_id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $stock = intval($row['stock']);
        } else {
            $pdo->rollBack();
            echo json_encode(['success' => false, 'error' => ['message' => 'Product not found']]);
            exit;
        }
    }
    if ($stock <= 0) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'error' => ['message' => 'This product is out of stock.']]);
        exit;
    }

    // Check if product is already in cart for this user/guest
    if ($user_id) {
        $stmt = $pdo->prepare("SELECT * FROM cart WHERE user_id = ? AND product_id = ? AND color_variation_id = ?");
        $stmt->execute([$user_id, $product_id, $color_variation_id]);
    } else {
        $stmt = $pdo->prepare("SELECT * FROM cart WHERE guest_id = ? AND product_id = ? AND color_variation_id = ?");
        $stmt->execute([$guest_id, $product_id, $color_variation_id]);
    }
    $cartItem = $stmt->fetch(PDO::FETCH_ASSOC);

    error_log("Check if item exists in cart - Result: " . print_r($cartItem, true));

    if ($cartItem) {
        // Product is in cart, update quantity
        $new_quantity = $cartItem['quantity'] + $quantity;
        if ($new_quantity > $stock) {
            $pdo->rollBack();
            echo json_encode([
                'success' => false,
                'error' => ['message' => 'Only ' . $stock . ' units available in stock.']
            ]);
            exit;
        }
        error_log("Item found in cart, updating quantity to: " . $new_quantity);
        if ($user_id) {
            $stmt = $pdo->prepare("UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ? AND color_variation_id = ?");
            $update_success = $stmt->execute([$new_quantity, $user_id, $product_id, $color_variation_id]);
        } else {
            $stmt = $pdo->prepare("UPDATE cart SET quantity = ? WHERE guest_id = ? AND product_id = ? AND color_variation_id = ?");
            $update_success = $stmt->execute([$new_quantity, $guest_id, $product_id, $color_variation_id]);
        }
        error_log("UPDATE query executed, success: " . ($update_success ? 'true' : 'false'));
    } else {
        // Product is not in cart, insert new item
        
        if ($quantity > $stock) {
            $pdo->rollBack();
            echo json_encode([
                'success' => false,
                'error' => ['message' => 'Only ' . $stock . ' units available in stock.']
            ]);
            exit;
        }
        error_log("Item not found in cart, inserting new item");
        $stmt = $pdo->prepare("INSERT INTO cart (user_id, guest_id, product_id, color_variation_id, quantity) VALUES (?, ?, ?, ?, ?)");
        $insert_success = $stmt->execute([$user_id, $guest_id, $product_id, $color_variation_id, $quantity]);
        error_log("INSERT query executed, success: " . ($insert_success ? 'true' : 'false'));
    }

    // Commit the transaction
    $pdo->commit();
    error_log("Transaction committed");

    // Fetch and return the updated cart data after successful operation
    error_log("Fetching updated cart data");
    $query = "
        SELECT
            c.id,
            c.product_id,
            c.color_variation_id,
            c.quantity,
            p.name,
            pcv.price,
            pcv.color_name,
            pcv.hex_code,
            p.image_url,
            p.description
        FROM cart c
        JOIN products p ON c.product_id = p.id
        LEFT JOIN product_color_variations pcv ON c.color_variation_id = pcv.id
        WHERE ";
    
    if ($user_id) {
        $query .= "c.user_id = ?";
        $param = $user_id;
    } else {
        $query .= "c.guest_id = ?";
        $param = $guest_id;
    }

    $stmt = $pdo->prepare($query);
    $stmt->execute([$param]);
    $cartItems = $stmt->fetchAll(PDO::FETCH_ASSOC);
    error_log("Fetched cart items: " . print_r($cartItems, true));


    $total = 0;
    foreach ($cartItems as &$item) {
        $total += $item['price'] * $item['quantity'];
        // Ensure image_url is correctly formatted for frontend
        if (!empty($item['image_url'])) {
            $img = ltrim($item['image_url'], '/\\');
            if (strpos($img, 'uploads/') === 0) {
                $img = substr($img, strlen('uploads/'));
            }
            $item['image_url'] = 'https://shopnest.example.com/backend/uploads/' . $img;
        } else {
            $item['image_url'] = '';
        }
    }
    error_log("Calculated total: " . $total);


    echo json_encode([
        'success' => true,
        'data' => [
            'items' => $cartItems,
            'total' => $total
        ]
    ]);
    error_log("Response sent: success true with updated cart data");


} catch (PDOException $e) {
    // Rollback transaction on error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
        error_log("Database error, transaction rolled back. Error: " . $e->getMessage());
    }
    http_response_code(500); // Internal Server Error
    echo json_encode([
        'success' => false,
        'error' => ['message' => 'Database error: ' . $e->getMessage()]
    ]);
    error_log("Response sent: success false due to database error");
} catch (Exception $e) {
     if ($pdo->inTransaction()) {
        $pdo->rollBack();
         error_log("Unexpected error, transaction rolled back. Error: " . $e->getMessage());
    }
    http_response_code(500); // Internal Server Error
    echo json_encode([
        'success' => false,
        'error' => ['message' => 'An unexpected error occurred: ' . $e->getMessage()]
    ]);
     error_log("Response sent: success false due to unexpected error");
}
?>