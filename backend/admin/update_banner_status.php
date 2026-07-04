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
    if (isset($data->is_active)) {
        $stmt = $pdo->prepare("UPDATE banners SET is_active = ? WHERE id = ?");
        $stmt->execute([$data->is_active ? 1 : 0, $data->id]);
    }
    
    // Can add display_order update logic here if needed

    echo json_encode(['success' => true, 'message' => 'Banner updated successfully']);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
