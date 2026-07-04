<?php
require_once __DIR__ . '/../cors.php';
require_once '../config/db.php';
require_once __DIR__ . '/../config/jwt_helper.php';

header('Content-Type: application/json');

$jwt_user = get_user_from_jwt();
$user_id = (is_array($jwt_user) && isset($jwt_user['sub'])) ? $jwt_user['sub'] : null;

if (!$user_id) {
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

$stmt = $pdo->prepare("DELETE FROM cart WHERE user_id = ?");
$stmt->execute([$user_id]);

echo json_encode(['success' => true]);
?>