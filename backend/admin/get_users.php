<?php
header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt_helper.php';
require_once __DIR__ . '/../config/encryption.php';

$jwt_user = get_user_from_jwt();
if (!$jwt_user || empty($jwt_user['admin']) || !$jwt_user['admin']) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit();
}

try {
    $stmt = $pdo->query("SELECT id, name, email, phone, address, last_used_address, avatar_url, created_at FROM users ORDER BY created_at DESC");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Decrypt sensitive data before sending to the frontend
    foreach ($users as &$user) {
        $user['name'] = robust_decrypt($user['name'], 'name');
        $user['phone'] = robust_decrypt($user['phone'], 'phone');
        $user['address'] = robust_decrypt($user['address'], 'text');
        $user['last_used_address'] = robust_decrypt($user['last_used_address'], 'text');
    }

    echo json_encode(['success' => true, 'data' => $users]);
} catch (Exception $e) {
    error_log('Error fetching users: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to fetch users: ' . $e->getMessage()]);
}
?> 