<?php
header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt_helper.php';
require_once __DIR__ . '/../config/encryption.php';
require_once __DIR__ . '/../vendor/autoload.php';

$input = json_decode(file_get_contents('php://input'), true);
error_log(print_r($input, true));
if (!isset($input['email'], $input['password'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Email and password are required']);
    exit();
}

try {
    $stmt = $pdo->prepare("SELECT id, name, email, phone, address, is_admin, created_at, verified, password FROM users WHERE email = ?");
    $stmt->execute([$input['email']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($input['password'], $user['password'])) {
        if ($user['verified'] != 1) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Account not verified. Please check your email for the OTP.']);
            exit();
        }
        unset($user['password']);
        $user['isAdmin'] = $user['is_admin'] == 1 ? true : false;
        unset($user['is_admin']);
        $user_id = $user['id'];
        $user['name'] = $user['name'] ? robust_decrypt($user['name'], 'name') : '';
        if ($user['name'] === '' && $user['name'] !== '') {
            $user['name'] = $user['name'];
        }
        $user['phone'] = $user['phone'] ? robust_decrypt($user['phone'], 'phone') : '';
        if ($user['phone'] === '' && $user['phone'] !== '') {
            $user['phone'] = $user['phone'];
        }
        $user['address'] = $user['address'] ? robust_decrypt($user['address'], 'text') : '';
        if ($user['address'] === '' && $user['address'] !== '') {
            $user['address'] = $user['address'];
        }
        $token = generate_jwt($user_id, false);
        echo json_encode([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $user_id,
                    'name' => $user['name'],
                    'email' => $user['email'],
                    'phone' => $user['phone'],
                    'address' => $user['address'],
                    'created_at' => $user['created_at'],
                    'isAdmin' => $user['isAdmin']
                ],
                'token' => $token
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid credentials❌']);
    }
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Login failed❌']);
}
?>