<?php
// Force server to bypass cache and use the latest version of the file.
if (function_exists('opcache_invalidate')) {
    opcache_invalidate(__FILE__, true);
}
require_once '../cors.php';
require_once '../config/db.php';
require_once __DIR__ . '/../config/jwt_helper.php';
require_once __DIR__ . '/../config/encryption.php';

$jwt_user = get_user_from_jwt();
if (!$jwt_user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit();
}
$user_id = is_array($jwt_user) ? $jwt_user['sub'] : $jwt_user->sub;

// Handle GET request - Fetch user profile
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    header("X-Profile-Version: 6.0"); // Version marker for debugging
    try {
        $stmt = $pdo->prepare("SELECT id, name, email, phone, address, avatar_url, last_used_address FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            $user['name'] = robust_decrypt($user['name'], 'name');
            $user['phone'] = robust_decrypt($user['phone'], 'phone');
            $user['address'] = robust_decrypt($user['address'], 'text');
            $user['last_used_address'] = robust_decrypt($user['last_used_address'], 'text');
        }
        echo json_encode(['success' => true, 'data' => $user]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Database error while fetching profile.']);
    }
    exit();
}

// Handle POST request - Update user profile
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = $_POST['name'] ?? '';
    $phone = $_POST['phone'] ?? '';
    $address = $_POST['address'] ?? '';

    if (!empty($phone) && !preg_match('/^\+91[6-9]\d{9}$/', $phone)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid phone number. Please use +91XXXXXXXXXX format.']);
        exit();
    }

    $encryptedName = $name ? encrypt_data($name) : null;
    $encryptedPhone = $phone ? encrypt_data($phone) : null;
    $encryptedAddress = $address ? encrypt_data($address) : null;
        $avatar_url = null;

        // Handle avatar upload
        if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = dirname(__DIR__, 2) . '/backend/uploads/avatars/';
            if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
            }
            $filename = uniqid() . '_' . basename($_FILES['avatar']['name']);
            $targetFile = $uploadDir . $filename;
        if (move_uploaded_file($_FILES['avatar']['tmp_name'], $targetFile)) {
                $avatar_url = 'https://shopnest.example.com/backend/uploads/avatars/' . $filename;
            }
        }

    // Build the SQL query dynamically
    $sql = "UPDATE users SET name=?, phone=?, address=?";
    $params = [$encryptedName, $encryptedPhone, $encryptedAddress];

    if ($avatar_url) {
        $sql .= ", avatar_url=?";
        $params[] = $avatar_url;
    }

    $sql .= " WHERE id=?";
    $params[] = $user_id;

    $stmt = $pdo->prepare($sql);
    $success = $stmt->execute($params);

    // After update, fetch and decrypt the updated user data
    $stmt = $pdo->prepare("SELECT id, name, email, phone, address, avatar_url, last_used_address FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($user) {
        $user['name'] = robust_decrypt($user['name'], 'name');
        $user['phone'] = robust_decrypt($user['phone'], 'phone');
        $user['address'] = robust_decrypt($user['address'], 'text');
        $user['last_used_address'] = robust_decrypt($user['last_used_address'], 'text');
    }
    echo json_encode(['success' => $success, 'avatar_url' => $avatar_url, 'data' => $user]);
    exit();
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method Not Allowed']);
?>