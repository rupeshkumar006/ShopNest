<?php
header('Content-Type: application/json; charset=UTF-8');
date_default_timezone_set('Asia/Kolkata');
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt_helper.php';
require_once __DIR__ . '/../config/email.php';
require_once __DIR__ . '/../config/encryption.php';
require_once __DIR__ . '/../vendor/autoload.php';

$pdo->exec("SET time_zone = '+05:30'");

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['email'], $input['password'], $input['name'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Name, email, and password are required']);
    exit();
}

$email = trim(strtolower($input['email']));
$name = trim($input['name']);
$password = $input['password'];
if (strlen($password) < 8) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Password must be at least 8 characters long.']);
    exit();
}
$phone = isset($input['phone']) ? trim($input['phone']) : null;
$encryptedPhone = $phone ? encrypt_data($phone) : null;

try {
    // Check if email already registered
    $stmt = $pdo->prepare("SELECT id, verified FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && $user['verified']) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Email already registered and verified']);
        exit();
    }

    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    if ($user && !$user['verified']) {
        // Update name/password if user exists but not verified
        $stmt = $pdo->prepare("UPDATE users SET name = ?, password = ?, phone = ? WHERE email = ?");
        $stmt->execute([$name, $hashedPassword, $encryptedPhone, $email]);
    } else if (!$user) {
        // Insert new user with verified = 0
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password, phone, verified) VALUES (?, ?, ?, ?, 0)");
        $stmt->execute([$name, $email, $hashedPassword, $encryptedPhone]);
    }

    // Remove any previous OTPs for this email
    $pdo->prepare("DELETE FROM otp_codes WHERE LOWER(email) = ?")->execute([$email]);

    $otp = rand(100000, 999999);
    $expires = date("Y-m-d H:i:s", strtotime("+10 minutes"));
    $pdo->prepare("INSERT INTO otp_codes (email, otp_code, expires_at) VALUES (?, ?, ?)")
        ->execute([$email, $otp, $expires]);
    sendOTP($email, $otp);
    echo json_encode(['success' => true, 'redirect' => 'otp', 'message' => 'Registration Finished. OTP sent to email.😀']);
} catch(PDOException $e) {
    http_response_code(500);
    $msg = $e->getMessage();
    if (strpos($msg, 'Duplicate entry') !== false) {
        echo json_encode(['success' => false, 'error' => 'Email already registered.']);
    } else {
        echo json_encode(['success' => false, 'error' => 'Registration failed: ' . $msg]);
    }
}
?>