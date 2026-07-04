<?php
// Force cache invalidation to ensure the server uses the correct file.
if (function_exists('opcache_invalidate')) {
    opcache_invalidate(__FILE__);
}

header('Content-Type: application/json');
require_once '../cors.php';
require_once '../config/db.php';
require_once __DIR__ . '/../config/jwt_helper.php';

$jwt_user = get_user_from_jwt();
if (!$jwt_user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit();
}

$user_id = is_array($jwt_user) ? $jwt_user['sub'] : $jwt_user->sub;

try {
    $stmt = $pdo->prepare("
        SELECT 
            b.id, 
            DATE_FORMAT(b.booking_datetime, '%Y-%m-%dT%H:%i:%sZ') as booking_datetime, 
            b.status,
            s.name as service_name 
        FROM service_bookings b 
        JOIN services s ON b.service_id = s.id 
        WHERE b.user_id = ? 
        ORDER BY b.booking_datetime DESC
    ");
    
    $stmt->execute([$user_id]);
    $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'data' => array_values($bookings)]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
?> 