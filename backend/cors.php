<?php

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php-error.log');

// Configuration for allowed origins
$allowedOrigins = [
    // Keep localhost for development
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost',
    'http://127.0.0.1',
];

// Optional production origin support
$productionOrigin = getenv('SHOPNEST_PRODUCTION_ORIGIN');
if ($productionOrigin !== false && $productionOrigin !== '') {
    $allowedOrigins[] = $productionOrigin;
}

// Get the origin from the request
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

// Check if the origin is allowed
$isAllowed = false;
foreach ($allowedOrigins as $allowedOrigin) {
    // Use strpos for more flexible matching, especially for localhost with varying ports
    if (strpos($origin, $allowedOrigin) === 0) {
        $isAllowed = true;
        break;
    }
}

// Set CORS headers based on origin validation
if ($origin === '' || $origin === null) {
    // Allow requests with no Origin (e.g., Postman, curl, server-to-server)
    // For production, you might want to restrict this for security.
} elseif ($isAllowed) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
} else {
    // Block disallowed origins
    http_response_code(403);
    exit();
}

// Always allow these methods and headers for preflight and actual requests
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Guest-ID, guest-id');
header('Access-Control-Max-Age: 86400'); // Cache preflight requests for 24 hours

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Additional security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Strict-Transport-Security: max-age=31536000; includeSubDomains');

// Set content type to JSON for all responses (if not already set by specific API endpoint)
if (!headers_sent() && !in_array('Content-Type: application/json; charset=UTF-8', headers_list())) {
header('Content-Type: application/json; charset=UTF-8');
}

// Function to handle CORS errors (though exits should handle most cases now)
function handleCorsError($message) {
    http_response_code(403);
    echo json_encode(['error' => $message]);
    exit();
}

// Validate request method (skip for OPTIONS, as handled above)
$allowedMethods = ['GET', 'POST', 'PUT', 'DELETE']; // OPTIONS already handled
if (!in_array($_SERVER['REQUEST_METHOD'], $allowedMethods)) {
    handleCorsError('Method not allowed');
}

?>



