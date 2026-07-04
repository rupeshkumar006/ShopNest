<?php
require_once '../cors.php';
header("Content-Type: application/json");

require_once '../config/db.php';

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->id)) {
    echo json_encode(['success' => false, 'error' => 'Banner ID is required']);
    exit;
}

try {
    // Delete images first (though CASCADE should handle it, explicit is safer for file cleanup if we implemented it)
    // Here we rely on ON DELETE CASCADE for DB cleanup
    
    $stmt = $pdo->prepare("DELETE FROM banners WHERE id = ?");
    $result = $stmt->execute([$data->id]);

    if ($result) {
        echo_success("Banner deleted successfully");
    } else {
        echo_error("Failed to delete banner");
    }

} catch (PDOException $e) {
    echo_error($e->getMessage());
}

function echo_success($msg) {
    echo json_encode(['success' => true, 'message' => $msg]);
}

function echo_error($msg) {
    echo json_encode(['success' => false, 'error' => $msg]);
}
?>
