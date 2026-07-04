<?php
header('Content-Type: application/json; charset=UTF-8');
date_default_timezone_set('Asia/Kolkata');
require_once __DIR__ . '/../cors.php';
require_once '../config/db.php';
$pdo->exec("SET time_zone = '+05:30'");

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['email'], $input['otp'], $input['newPassword'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Email, OTP, and new password are required']);
    exit();
}

if (strlen($input['newPassword']) < 8) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Password must be at least 8 characters long.']);
    exit();
}

// Verify OTP
$stmt = $pdo->prepare("SELECT * FROM otp_codes WHERE email = ? AND otp_code = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1");
$stmt->execute([$input['email'], $input['otp']]);
$otpRow = $stmt->fetch();

if (!$otpRow) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid or expired OTP']);
    exit();
}

try {
    // Update password
    $hashedPassword = password_hash($input['newPassword'], PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE email = ?");
    $stmt->execute([$hashedPassword, $input['email']]);
    echo json_encode(['success' => true, 'message' => 'Password reset successful']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Password reset failed: ' . $e->getMessage()]);
}
?> 