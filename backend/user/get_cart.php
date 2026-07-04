<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt_helper.php'; // Ensure this includes get_user_from_jwt

ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../php-error.log');

header('Content-Type: application/json');

// Get user data from JWT
$jwt_user = get_user_from_jwt();
$user_id = isset($jwt_user['sub']) ? $jwt_user['sub'] : null;

// Guest logic
$guest_id = null;
if (!$user_id) {
    require_once __DIR__ . '/../config/guest_helper.php';
    $guest_id = get_guest_id();
}

error_log("get_cart.php: User ID: " . $user_id . ", Guest ID: " . $guest_id);

// Validate user ID or Guest ID
if (!$user_id && !$guest_id) {
    // Return empty cart for completely unknown user instead of 401?
    // Or just 401. Current frontend likely expects 200 with empty list or strict auth.
    // For guest shopping, we should probably allow 200 with empty items if no ID, but guest_id should exist if frontend is updated.
    // If frontend sends Guest-ID, we use it. 
    http_response_code(401); // Unauthorized
    echo json_encode(['success' => false, 'error' => ['message' => 'Unauthorized access']]);
    exit;
}

try {
    // Fetch cart items for the user or guest
    $query = "
        SELECT
            c.id,
            c.product_id,
            c.color_variation_id,
            c.quantity,
            p.name,
            p.unit_type,
            p.packet_size,
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

    error_log("get_cart.php: Fetched cart items: " . print_r($cartItems, true));

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
        if (empty($item['unit_type'])) { $item['unit_type'] = 'pieces'; }
        if ($item['unit_type'] !== 'packets') { $item['packet_size'] = null; }
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'items' => $cartItems,
            'total' => $total
        ]
    ]);

} catch (PDOException $e) {
    error_log("get_cart.php: Database error: " . $e->getMessage());
    http_response_code(500); // Internal Server Error
    echo json_encode([
        'success' => false,
        'error' => ['message' => 'Database error: ' . $e->getMessage()]
    ]);
} catch (Exception $e) {
    error_log("get_cart.php: An unexpected error occurred: " . $e->getMessage());
    http_response_code(500); // Internal Server Error
    echo json_encode([
        'success' => false,
        'error' => ['message' => 'An unexpected error occurred: ' . $e->getMessage()]
    ]);
}
?>