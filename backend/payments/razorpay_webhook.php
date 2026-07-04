<?php
header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/../cors.php';
include '../config/razorpay.php';
include '../config/db.php';

// Set timezone to IST
date_default_timezone_set('Asia/Kolkata');

// Set your Razorpay webhook secret (from Razorpay dashboard)
$webhookSecret = 'YOUR_RAZORPAY_WEBHOOK_SECRET'; // <-- CHANGE THIS

// Read the request body and signature
$body = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_RAZORPAY_SIGNATURE'] ?? '';

// Function to verify Razorpay signature
function verifySignature($body, $signature, $secret) {
    $expected = hash_hmac('sha256', $body, $secret);
    return hash_equals($expected, $signature);
}

// Log every event (raw body and timestamp) in IST
file_put_contents(
    __DIR__ . '/razorpay_webhook.log',
    "[" . date('Y-m-d H:i:s T') . "] " . $body . PHP_EOL,
    FILE_APPEND
);

// Verify the webhook signature
if (!verifySignature($body, $signature, $webhookSecret)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid signature']);
    exit();
}

// Parse the webhook payload
$data = json_decode($body, true);
$event = $data['event'] ?? '';

// Example: handle payment success
if ($event === 'payment.captured') {
    $paymentId = $data['payload']['payment']['entity']['id'];
    $amount = $data['payload']['payment']['entity']['amount'] / 100; // Razorpay sends amount in paise
    $email = $data['payload']['payment']['entity']['email'] ?? null;

    // Update your order/payment status in the database here
    $stmt = $pdo->prepare("UPDATE orders SET status='paid' WHERE payment_id=?");
    $stmt->execute([$paymentId]);
}

// You can handle other events (refund, failed, etc.) similarly

echo json_encode(['success' => true]);
?>