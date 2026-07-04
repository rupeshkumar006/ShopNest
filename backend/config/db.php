<?php
$host = getenv('SHOPNEST_DB_HOST') ?: 'localhost';
$user = getenv('SHOPNEST_DB_USER') ?: 'root';
$pass = getenv('SHOPNEST_DB_PASSWORD') ?: '';
$dbname = getenv('SHOPNEST_DB_NAME') ?: 'shopnest_db';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Set timezone to IST
    $pdo->exec("SET time_zone = '+05:30'");
    date_default_timezone_set('Asia/Kolkata');
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode(['error' => 'Database connection failed']);
    exit();
}
