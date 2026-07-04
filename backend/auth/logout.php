<?php
header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/../cors.php';
require_once '../config/db.php';
// No server-side logout needed for JWT. Just return success.
echo json_encode(['success' => true]);
?>