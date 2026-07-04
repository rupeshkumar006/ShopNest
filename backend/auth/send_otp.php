<?php
header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/../cors.php';
require_once '../config/db.php';
require_once '../config/email.php';
date_default_timezone_set('Asia/Kolkata');

$pdo->exec("SET time_zone = '+05:30'");

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['email'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Email is required']);
    exit();
}

$email = trim(strtolower($input['email']));

// Check if this is for password reset (user must exist)
if (isset($input['forReset']) && $input['forReset']) {
    $stmt = $pdo->prepare("SELECT id FROM users WHERE LOWER(email) = ?");
    $stmt->execute([$email]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Email not registered']);
        exit();
    }
}

// Rate limiting: max 5 OTPs per hour per email
$stmt = $pdo->prepare("SELECT COUNT(*) FROM otp_codes WHERE LOWER(email) = ? AND created_at > (NOW() - INTERVAL 1 HOUR)");
$stmt->execute([$email]);
$count = $stmt->fetchColumn();
if ($count >= 5) {
    http_response_code(429);
    echo json_encode(['success' => false, 'error' => 'Too many OTP requests. Please wait 1 hour before requesting again.']);
    exit();
}

// Generate OTP and set expiry to 5 minutes from now
$otp = rand(100000, 999999);
$expires = date("Y-m-d H:i:s", strtotime("+5 minutes"));
try {
    $pdo->prepare("INSERT INTO otp_codes (email, otp_code, expires_at) VALUES (?, ?, ?)")
        ->execute([$email, $otp, $expires]);
    sendOTP($email, $otp);
    echo json_encode(['success' => true, 'message' => 'OTP sent to email.']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to send OTP: ' . $e->getMessage()]);
}
?>