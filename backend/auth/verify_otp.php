<?php
header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/../cors.php';
require_once '../config/db.php';
require_once __DIR__ . '/../config/jwt_helper.php';
$pdo->exec("SET time_zone = '+05:30'");
date_default_timezone_set('Asia/Kolkata');  

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['email'], $input['otp'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Email and OTP are required']);
    exit();
}

$email = trim(strtolower($input['email']));
$otp = trim((string)$input['otp']);

try {
    // Check OTP in otp_codes table and not expired
    $sql = "SELECT * FROM otp_codes WHERE LOWER(email) = ? AND otp_code = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$email, $otp]);
    $otpRow = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($otpRow) {
        // Mark user as verified, but only if user exists and is not already verified
        $stmt = $pdo->prepare("UPDATE users SET verified = 1 WHERE LOWER(email) = ? AND verified = 0");
        $stmt->execute([$email]);
        // Delete the OTP after use
        $pdo->prepare("DELETE FROM otp_codes WHERE id = ?")->execute([$otpRow['id']]);
        // Fetch the user
        $stmt = $pdo->prepare("SELECT id, email, name, is_admin as isAdmin, verified FROM users WHERE LOWER(email) = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        // Generate a JWT token
        $token = generate_jwt($user['id'], $user['isAdmin']);
        echo json_encode([
            'success' => true,
            'data' => [
                'user' => $user,
                'token' => $token
            ]
        ]);
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid or expired OTP🧠']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'OTP verification failed: ' . $e->getMessage()]);
}
?>