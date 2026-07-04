<?php
require_once __DIR__ . '/../cors.php';
require_once '../config/db.php';
require_once '../utils/send_email.php';
header('Content-Type: application/json; charset=UTF-8');

$input = json_decode(file_get_contents('php://input'), true);
$email = isset($input['email']) ? trim($input['email']) : '';
$subject = isset($input['subject']) ? trim($input['subject']) : '';
$message = isset($input['message']) ? trim($input['message']) : '';

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !$subject || !$message) {
    echo json_encode(['success' => false, 'error' => 'Invalid input']);
    exit;
}

try {
    sendGeneralEmail($email, $subject, $message);
    echo json_encode(['success' => true, 'message' => 'Email sent']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Failed to send email']);
} 