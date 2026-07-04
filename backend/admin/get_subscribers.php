<?php
require_once __DIR__ . '/../cors.php';
require_once '../config/db.php';
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

$stmt = $pdo->query('SELECT id, email, name, subscribed_at FROM newsletter_subscribers ORDER BY subscribed_at DESC');
$subscribers = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(['success' => true, 'data' => $subscribers]); 