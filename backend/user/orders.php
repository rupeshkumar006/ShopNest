<?php
header('Content-Type: application/json');
require_once '../cors.php';
require_once '../config/db.php';
require_once __DIR__ . '/../config/jwt_helper.php';
require_once __DIR__ . '/../config/encryption.php'; // Ensure decryption is available

$jwt_user = get_user_from_jwt();
if (!$jwt_user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit();
}
$user_id = $jwt_user['sub'];


try {
    // Single, efficient query to get all orders and aggregate their items into a JSON string
    $stmt = $pdo->prepare("
        SELECT 
            o.id, 
            o.user_id,
            o.total_amount, 
            o.status, 
            o.created_at,
            o.name,
            o.phone,
            o.shipping_address,
            o.billing_address,
            -- Aggregate items into a JSON array string. If no items, this will be NULL.
            CASE 
                WHEN COUNT(oi.id) > 0 THEN CONCAT('[', GROUP_CONCAT(JSON_OBJECT(
                    'product_name', p.name,
                    'product_description', p.description,
                    'quantity', oi.quantity,
                    'price', oi.price,
                    'color_variation_id', oi.color_variation_id,
                    'color_name', COALESCE(pcv.color_name, ''),
                    'hex_code', COALESCE(pcv.hex_code, ''),
                    'product_image', CASE 
                                        WHEN p.image_url IS NOT NULL AND p.image_url != '' 
                                        THEN CONCAT('https://shopnest.example.com/backend/uploads/', p.image_url)
                                        ELSE '' 
                                     END
                )), ']')
                ELSE '[]'
            END as items_json
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        LEFT JOIN product_color_variations pcv ON oi.color_variation_id = pcv.id
        WHERE o.user_id = ? AND (o.status = 'paid' OR o.status = 'delivered' OR o.status = 'failed')
        GROUP BY o.id
        ORDER BY o.created_at DESC
    ");
    $stmt->execute([$user_id]);
    $orders_with_json_items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Process the results to decode the JSON items string
    $orders = array_map(function($order) use ($pdo) {
        $order['name'] = robust_decrypt($order['name'], 'name');
        $order['phone'] = robust_decrypt($order['phone'], 'phone');
        $order['shipping_address'] = robust_decrypt($order['shipping_address'], 'text');
        $order['billing_address'] = robust_decrypt($order['billing_address'], 'text');
        // REMOVE fallback to profile name/phone. Only use order record.
        $order['items'] = json_decode($order['items_json'], true);
        // For each item, fetch color variant image if color_variation_id is set
        foreach ($order['items'] as &$item) {
            if (!empty($item['color_variation_id'])) {
                $stmtImg = $pdo->prepare('SELECT image_url FROM product_color_images WHERE color_variation_id = ? ORDER BY sort_order ASC LIMIT 1');
                $stmtImg->execute([$item['color_variation_id']]);
                $imgRow = $stmtImg->fetch(PDO::FETCH_ASSOC);
                if ($imgRow && !empty($imgRow['image_url'])) {
                    $img = $imgRow['image_url'];
                    if (strpos($img, 'http') === 0) {
                        $item['product_image'] = $img;
                    } else {
                        $item['product_image'] = 'https://shopnest.example.com/backend/uploads/' . ltrim($img, '/\\');
                    }
                } else {
                    $item['product_image'] = $item['product_image'];
                }
                // Fetch color details
                $stmtColor = $pdo->prepare('SELECT color_name, hex_code FROM product_color_variations WHERE id = ?');
                $stmtColor->execute([$item['color_variation_id']]);
                $colorRow = $stmtColor->fetch(PDO::FETCH_ASSOC);
                $item['color_name'] = $colorRow['color_name'] ?? '';
                $item['hex_code'] = $colorRow['hex_code'] ?? '';
            }
            if (empty($item['product_image'])) {
                $item['product_image'] = '/default-image.png';
            }
        }
        unset($item);
        unset($order['items_json']);
        return $order;
    }, $orders_with_json_items);

    echo json_encode(['success' => true, 'data' => ['orders' => $orders]]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
?> 