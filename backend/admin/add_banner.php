<?php
require_once '../cors.php';
header("Content-Type: application/json");

require_once '../config/db.php';

// Handle file uploads
$target_dir = "../uploads/banners/";
if (!file_exists($target_dir)) {
    mkdir($target_dir, 0777, true);
}

try {
    $pdo->beginTransaction();

    $title = $_POST['title'] ?? null;
    $description = $_POST['description'] ?? null;
    $style_template = $_POST['style_template'] ?? 'standard';
    $is_active = $_POST['is_active'] === 'true' ? 1 : 0; // Handle JS boolean passed as string

    // 1. Insert Banner
    $stmt = $pdo->prepare("INSERT INTO banners (title, description, style_template, is_active) VALUES (?, ?, ?, ?)");
    $stmt->execute([$title, $description, $style_template, $is_active]);
    $banner_id = $pdo->lastInsertId();

    // 2. Insert Images
    // Images are sent as 'images[]' in input file
    // Link URLs are sent as 'link_urls[]' array text fields associated with images index
    
    if (isset($_FILES['images'])) {
        $files = $_FILES['images'];
        $link_urls = $_POST['link_urls'] ?? []; 
        $count = count($files['name']);

        for ($i = 0; $i < $count; $i++) {
            if ($files['error'][$i] === UPLOAD_ERR_OK) {
                $tmp_name = $files['tmp_name'][$i];
                $name = basename($files['name'][$i]);
                $unique_name = time() . "_" . uniqid() . "_" . $name;
                $target_file = $target_dir . $unique_name;
                
                // Construct URL path for DB (accessible from frontend)
                $db_image_url = "/backend/uploads/banners/" . $unique_name;

                if (move_uploaded_file($tmp_name, $target_file)) {
                    $link_url = isset($link_urls[$i]) ? $link_urls[$i] : null;

                    $stmt_img = $pdo->prepare("INSERT INTO banner_images (banner_id, image_url, link_url, display_order) VALUES (?, ?, ?, ?)");
                    $stmt_img->execute([$banner_id, $db_image_url, $link_url, $i]);
                } else {
                    throw new Exception("Failed to upload image: " . $name);
                }
            }
        }
    }

    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Banner created successfully', 'id' => $banner_id]);

} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
