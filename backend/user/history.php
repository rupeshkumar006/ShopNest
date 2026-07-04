<?php
require_once '../cors.php';
require_once '../config/db.php';
require_once __DIR__ . '/../config/jwt_helper.php';
require_once '../config/encryption.php';

$jwt_user = get_user_from_jwt();
if (!$jwt_user) {
    http_response_code(401);
    echo json_encode(['error' => 'Not logged in']);
    exit();
}
$user_id = is_array($jwt_user) ? $jwt_user['sub'] : $jwt_user->sub;

// Add deleted column to services if it doesn't exist
try {
    $pdo->exec('ALTER TABLE services ADD COLUMN deleted TINYINT(1) DEFAULT 0');
} catch (PDOException $e) {
    // Column already exists, ignore
}

$orders = $pdo->prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC");
$orders->execute([$user_id]);
$order_history = $orders->fetchAll(PDO::FETCH_ASSOC);

// Updated booking query to handle deleted services gracefully
$bookings = $pdo->prepare("
    SELECT b.*, 
           COALESCE(s.name, 'Service Deleted') as service_name, 
           s.image_url as service_image,
           CASE WHEN s.deleted = 1 OR s.id IS NULL THEN 1 ELSE 0 END as service_deleted
    FROM bookings b 
    LEFT JOIN services s ON b.service_id = s.id AND (s.deleted = 0 OR s.deleted IS NULL)
    WHERE b.user_id = ? 
    ORDER BY b.created_at DESC
");
$bookings->execute([$user_id]);
$booking_history = $bookings->fetchAll(PDO::FETCH_ASSOC);

foreach ($order_history as &$order) {
    $order['phone'] = robust_decrypt($order['phone'], 'phone');
    $order['shipping_address'] = robust_decrypt($order['shipping_address'], 'text');
    $order['billing_address'] = robust_decrypt($order['billing_address'], 'text');
}
foreach ($booking_history as &$booking) {
    $booking['phone'] = decrypt_data($booking['phone']);
    $booking['address'] = decrypt_data($booking['address']);
    // Venue is stored as plain text, no need to decrypt
    // Ensure service_image is an absolute URL
    if (!empty($booking['service_image']) && strpos($booking['service_image'], 'http') !== 0) {
        $booking['service_image'] = 'https://shopnest.example.com/backend/' . ltrim($booking['service_image'], '/');
    }
    // If service is deleted, set a default image
    if ($booking['service_deleted'] == 1) {
        $booking['service_image'] = 'https://shopnest.example.com/public/default-image.png';
    }
}
echo json_encode([
    'orders' => $order_history,
    'bookings' => $booking_history
]);
?>