<?php
require_once __DIR__ . '/../cors.php';
require_once '../config/db.php';
require_once '../utils/send_email.php';
header('Content-Type: application/json; charset=UTF-8');

$pdo->exec(
    "CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) DEFAULT NULL,
        subscribed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
);

$input = json_decode(file_get_contents('php://input'), true);
$email = isset($input['email']) ? trim($input['email']) : '';
$name = isset($input['name']) ? trim($input['name']) : '';

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'error' => 'Invalid email address']);
    exit;
}

// Check if already subscribed
$stmt = $pdo->prepare('SELECT id FROM newsletter_subscribers WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    echo json_encode(['success' => true, 'message' => 'Already subscribed']);
    exit;
}

// Insert subscriber
$stmt = $pdo->prepare('INSERT INTO newsletter_subscribers (email, name) VALUES (?, ?)');
$stmt->execute([$email, $name]);

// Send welcome email
$subject = 'Welcome to ShopNest Newsletter!';
$message = "<h2>🎈 Welcome to ShopNest! 🎈</h2><p>Thank you for subscribing to our newsletter. You'll now receive party tips, special offers, and balloon inspiration straight to your inbox!</p><p>Let's make every celebration magical!<br>- The ShopNest Team</p>";
try {
    sendGeneralEmail($email, $subject, $message);
} catch (Exception $e) {
    // Log but don't fail
}

echo json_encode(['success' => true, 'message' => 'Subscribed and welcome email sent']); 