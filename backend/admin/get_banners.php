<?php
require_once '../cors.php';
header("Content-Type: application/json");

require_once '../config/db.php';

$isAdmin = isset($_GET['admin']) && $_GET['admin'] === 'true';

try {
    $sql = "SELECT b.*, 
            GROUP_CONCAT(
                JSON_OBJECT(
                    'id', bi.id,
                    'image_url', bi.image_url,
                    'link_url', bi.link_url,
                    'display_order', bi.display_order
                ) ORDER BY bi.display_order ASC
            ) as images
            FROM banners b
            LEFT JOIN banner_images bi ON b.id = bi.banner_id";

    if (!$isAdmin) {
        $sql .= " WHERE b.is_active = 1";
    }

    $sql .= " GROUP BY b.id ORDER BY b.display_order ASC, b.created_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $banners = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Parse the JSON string from GROUP_CONCAT back into an array
    foreach ($banners as &$banner) {
        if ($banner['images']) {
            // Mysql GROUP_CONCAT with JSON_OBJECT might return a string like "{...},{...}" which isn't valid JSON array
            // But we can wrap it in brackets to make it valid JSON array string: "[{...},{...}]"
            $jsonString = "[" . $banner['images'] . "]";
            $banner['images'] = json_decode($jsonString, true);
        } else {
            $banner['images'] = [];
        }
    }

    echo json_encode(['success' => true, 'data' => $banners]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
