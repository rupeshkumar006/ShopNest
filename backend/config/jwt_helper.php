<?php
require_once __DIR__ . '/../vendor/autoload.php'; // Adjust if needed
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

const JWT_SECRET = getenv('SHOPNEST_JWT_SECRET') ?: 'hello@554161656133'; // Use a strong, random key!

function generate_jwt($user_id, $is_admin) {
    $payload = [
        'sub' => $user_id, // Subject (user ID)
        'admin' => $is_admin,
        'iat' => time(), // Issued At time
        'exp' => time() + (60 * 60 * 24 * 7) // Expiration time (1 week)
    ];
    return JWT::encode($payload, JWT_SECRET, 'HS256');
}

function get_user_from_jwt() {
    $authHeader = null;
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (function_exists('getallheaders')) {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
    }
    
    if (!$authHeader) return null;
    if (strpos($authHeader, 'Bearer ') !== 0) return null;
    
    $jwt = substr($authHeader, 7);
    
    try {
        $decoded = JWT::decode($jwt, new Key(JWT_SECRET, 'HS256'));
        return (array) $decoded;
    } catch (Exception $e) {
        error_log("JWT Decode Error: " . $e->getMessage());
        return null;
    }
}

// Optional: Function to verify admin token
function verifyAdminToken($token) {
    try {
        $decoded = JWT::decode($token, new Key(JWT_SECRET, 'HS256'));
        // Check if the 'admin' claim exists and is true
        return isset($decoded->admin) && $decoded->admin === true;
    } catch (Exception $e) {
        // Log the exception for debugging
        error_log("Admin Token Verification Error: " . $e->getMessage());
        return false;
    }
}

?>