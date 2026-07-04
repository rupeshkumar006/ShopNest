<?php
  error_log('ADMIN LOGIN.PHP EXECUTED');
header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt_helper.php';

// Debug: Log all POST data and raw input
error_log('RAW POST: ' . file_get_contents('php://input'));
error_log('POST ARRAY: ' . print_r($_POST, true));
error_log('CONTENT_TYPE: ' . ($_SERVER['CONTENT_TYPE'] ?? 'none'));

// Always decode JSON input, fallback to $_POST for form-data
$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);
if (!is_array($input)) {
    $input = $_POST;
}

$username = $input['username'] ?? $input['email'] ?? null;
$password = $input['password'] ?? null;

if (!$username || !$password) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Username and password are required']);
    exit;
}

// Check against the admins table
$stmt = $pdo->prepare("SELECT * FROM admins WHERE username = ?");
$stmt->execute([$username]);
$admin = $stmt->fetch(PDO::FETCH_ASSOC);

if ($admin && password_verify($password, $admin['password'])) {
    $admin_id = $admin['id'];
    $token = generate_jwt($admin_id, true);
    echo json_encode([
        'success' => true,
        'data' => [
            'user' => [
                'id' => $admin_id,
                'username' => $username,
                'isAdmin' => true
            ],
            'token' => $token
        ]
    ]);
} else {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Invalid admin credentials']);
}
?>