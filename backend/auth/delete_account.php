<?php
header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/../cors.php';
require_once '../config/db.php';
require_once __DIR__ . '/../config/jwt_helper.php';

$jwt_user = get_user_from_jwt();
if (!$jwt_user) {
    http_response_code(401);
    echo json_encode(['error' => 'Not logged in']);
    exit();
}
$user_id = $jwt_user->sub;

$input = json_decode(file_get_contents('php://input'), true);

try {
    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    echo json_encode(['success' => true, 'message' => 'Account deleted']);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to delete account']);
}
?>
