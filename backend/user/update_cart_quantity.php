<?php
require_once '../cors.php';
require_once '../config/db.php';
require_once __DIR__ . '/../config/jwt_helper.php';

header('Content-Type: application/json');

// Get the request body
$input = json_decode(file_get_contents('php://input'), true);
$input = (array) $input;

$product_id = isset($input['product_id']) ? intval($input['product_id']) : 0;
$color_variation_id = isset($input['color_variation_id']) ? intval($input['color_variation_id']) : null;
// If color_variation_id is null, fetch the default color variation for this product
if ($color_variation_id === null) {
    $stmt = $pdo->prepare('SELECT id FROM product_color_variations WHERE product_id = ? ORDER BY id ASC LIMIT 1');
    $stmt->execute([$product_id]);
    $color_variation_id = $stmt->fetchColumn();
    if (!$color_variation_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => ['message' => 'No color variation found for this product']]);
        exit;
    }
}
$quantity = (isset($input['quantity']) && is_numeric($input['quantity']) && $input['quantity'] >= 0) ? intval($input['quantity']) : 0; // Allow 0 for removal

// Get user data from JWT
$jwt_user = get_user_from_jwt();
$user_id = isset($jwt_user['sub']) ? $jwt_user['sub'] : null;

// Validate user, product ID, and quantity
if (!$user_id || $product_id <= 0 || $quantity < 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => ['message' => 'Invalid request data']]);
    exit;
}

// No global max quantity limit; only validate against stock and minimums

// Check stock for product or color variation
$stock = 0;
if ($color_variation_id) {
    $stmt = $pdo->prepare('SELECT stock FROM product_color_variations WHERE id = ? AND product_id = ?');
    $stmt->execute([$color_variation_id, $product_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        $stock = intval($row['stock']);
    } else {
        http_response_code(400);
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
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => ['message' => 'Product not found']]);
        exit;
    }
}
if ($quantity > $stock) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => ['message' => 'Only ' . $stock . ' units available in stock.']]);
    exit;
}

try {
    // Start transaction
    $pdo->beginTransaction();

    if ($quantity === 0) {
        // If quantity is 0, remove the item
        $stmt = $pdo->prepare("DELETE FROM cart WHERE user_id = ? AND product_id = ? AND color_variation_id = ?");
        $stmt->execute([$user_id, $product_id, $color_variation_id]);
    } else {
        // If quantity > 0, update the quantity
        $stmt = $pdo->prepare("UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ? AND color_variation_id = ?");
        $stmt->execute([$quantity, $user_id, $product_id, $color_variation_id]);
         // If the item wasn't in the cart and quantity > 0, this update won't do anything.
         // You might want to add logic here to insert if it doesn't exist, but typically
         // updateQuantity is called for existing items.
    }

    // Commit transaction
    $pdo->commit();

    // Fetch and return the updated cart data
    $stmt = $pdo->prepare("
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
        WHERE c.user_id = ?
    ");
    $stmt->execute([$user_id]);
    $cartItems = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $total = 0;
    foreach ($cartItems as &$item) {
        $total += $item['price'] * $item['quantity'];
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

    echo json_encode([
        'success' => true,
        'data' => [
            'items' => $cartItems,
            'total' => $total
        ]
    ]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("update_cart_quantity.php: Database error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => ['message' => 'Database error: ' . $e->getMessage()]
    ]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("update_cart_quantity.php: An unexpected error occurred: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => ['message' => 'An unexpected error occurred: ' . $e->getMessage()]
    ]);
}
?>