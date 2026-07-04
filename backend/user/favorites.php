<?php
header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/../cors.php';
require_once '../config/db.php';
require_once __DIR__ . '/../config/jwt_helper.php';
$jwt_user = get_user_from_jwt();
$user_id = $jwt_user ? $jwt_user->sub : null;


$stmt = $pdo->prepare("SELECT p.* FROM products p JOIN wishlist w ON p.id = w.product_id WHERE w.user_id = ?");
$stmt->execute([$user_id]);
$favorites = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($favorites);
?>
