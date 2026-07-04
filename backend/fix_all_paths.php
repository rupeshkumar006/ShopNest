<?php
header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/config/db.php';

$filesToFix = [
    'admin/feature_review.php' => [
        'require_once \'../config/db.php\';' => 'require_once __DIR__ . \'/../config/db.php\';'
    ],
    'admin/get_all_reviews.php' => [
        'require_once \'../config/db.php\';' => 'require_once __DIR__ . \'/../config/db.php\';',
        'require_once \'../config/encryption.php\';' => 'require_once __DIR__ . \'/../config/encryption.php\';'
    ],
    'admin/get_all_service_reviews.php' => [
        'require_once \'../config/db.php\';' => 'require_once __DIR__ . \'/../config/db.php\';',
        'require_once \'../config/encryption.php\';' => 'require_once __DIR__ . \'/../config/encryption.php\';'
    ],
    'admin/get_service_bookings.php' => [
        'require_once \'../config/db.php\';' => 'require_once __DIR__ . \'/../config/db.php\';',
        'require_once \'../config/encryption.php\';' => 'require_once __DIR__ . \'/../config/encryption.php\';'
    ],
    'admin/get_subscribers.php' => [
        'require_once \'../config/db.php\';' => 'require_once __DIR__ . \'/../config/db.php\';'
    ],
    'admin/send_custom_newsletter.php' => [
        'require_once \'../config/db.php\';' => 'require_once __DIR__ . \'/../config/db.php\';',
        'require_once \'../utils/send_email.php\';' => 'require_once __DIR__ . \'/../utils/send_email.php\';'
    ],
    'admin/update_order_status.php' => [
        'require_once \'../config/db.php\';' => 'require_once __DIR__ . \'/../config/db.php\';',
        'require_once \'../utils/send_email.php\';' => 'require_once __DIR__ . \'/../utils/send_email.php\';'
    ],
    'admin/view_orders.php' => [
        'require_once \'../config/db.php\';' => 'require_once __DIR__ . \'/../config/db.php\';'
    ],
    'admin/view_bookings.php' => [
        'require_once \'../config/db.php\';' => 'require_once __DIR__ . \'/../config/db.php\';',
        'require_once \'../config/encryption.php\';' => 'require_once __DIR__ . \'/../config/encryption.php\';'
    ],
    'admin/update_booking_status.php' => [
        'require_once \'../config/db.php\';' => 'require_once __DIR__ . \'/../config/db.php\';',
        'require_once \'../utils/send_email.php\';' => 'require_once __DIR__ . \'/../utils/send_email.php\';'
    ],
    'admin/stats.php' => [
        'require_once \'../config/db.php\';' => 'require_once __DIR__ . \'/../config/db.php\';'
    ]
];

$results = [];
$errors = [];

foreach ($filesToFix as $file => $replacements) {
    $filePath = __DIR__ . '/' . $file;
    
    if (!file_exists($filePath)) {
        $errors[] = "File not found: $file";
        continue;
    }
    
    try {
        $content = file_get_contents($filePath);
        $originalContent = $content;
        
        foreach ($replacements as $search => $replace) {
            $content = str_replace($search, $replace, $content);
        }
        
        if ($content !== $originalContent) {
            file_put_contents($filePath, $content);
            $results[] = "Fixed: $file";
        } else {
            $results[] = "No changes needed: $file";
        }
    } catch (Exception $e) {
        $errors[] = "Error fixing $file: " . $e->getMessage();
    }
}

echo json_encode([
    'success' => true,
    'message' => 'Path fixes completed',
    'results' => $results,
    'errors' => $errors,
    'summary' => [
        'total_files' => count($filesToFix),
        'fixed' => count(array_filter($results, fn($r) => strpos($r, 'Fixed:') === 0)),
        'no_changes' => count(array_filter($results, fn($r) => strpos($r, 'No changes needed:') === 0)),
        'errors' => count($errors)
    ]
], JSON_PRETTY_PRINT);
?>
