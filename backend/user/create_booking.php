<?php
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../booking_debug.log');
header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/../cors.php';
require_once '../config/db.php';
require_once __DIR__ . '/../config/jwt_helper.php';
require_once __DIR__ . '/../utils/send_email.php';
require_once __DIR__ . '/../config/encryption.php';

// Set timezone to IST
date_default_timezone_set('Asia/Kolkata');

// Verify user authentication using JWT
$jwt_user = get_user_from_jwt();
if (!$jwt_user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit();
}
$user_id = $jwt_user->sub; // Get user ID from JWT

// Get request data
$data = json_decode(file_get_contents('php://input'), true);

// Validate required fields
$requiredFields = ['serviceId', 'name', 'email', 'phone', 'address', 'venue', 'date', 'time'];
foreach ($requiredFields as $field) {
    if (!isset($data[$field]) || empty($data[$field])) {
        echo json_encode([
            'success' => false,
            'error' => "Missing required field: $field"
        ]);
        exit;
    }
}

// Add phone number validation here
if (!preg_match('/^\+91[6-9]\d{9}$/', $data['phone'])) {
    echo json_encode([
        'success' => false,
        'error' => 'Invalid phone number format. Must be +91XXXXXXXXXX'
    ]);
    exit;
}

// Add date validation here
$bookingDate = strtotime($data['date']);
$currentDate = strtotime(date('Y-m-d'));
if ($bookingDate < $currentDate) {
    echo json_encode([
        'success' => false,
        'error' => 'Booking date must be in the future'
    ]);
    exit;
}

try {
    // Start transaction
    $pdo->beginTransaction();

    // Combine date and time
    $bookingDatetime = date('Y-m-d H:i:s', strtotime($data['date'] . ' ' . $data['time']));

    // Always save the phone number from the form, even if empty
    $encryptedPhone = encrypt_data($data['phone']);

    // Insert booking - match the actual database column order
    $stmt = $pdo->prepare("
        INSERT INTO bookings (
            user_id, name, phone, address, booking_datetime, status, venue, service_id, email, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");

    $stmt->execute([
        $user_id,
        $data['name'],
        $encryptedPhone,
        $data['address'],
        $bookingDatetime,
        'pending',
        $data['venue'],
        $data['serviceId'],
        $data['email'],
        $data['notes'] ?? null
    ]);

    $bookingId = $pdo->lastInsertId();

    // Update user's last_used_address to latest booking address
    $stmt = $pdo->prepare("UPDATE users SET last_used_address = ? WHERE id = ?");
    $stmt->execute([$data['address'], $user_id]);

    // Get service details for email
    $stmt = $pdo->prepare("SELECT name FROM services WHERE id = ?");
    $stmt->execute([$data['serviceId']]);
    $service = $stmt->fetch(PDO::FETCH_ASSOC);

    // Send confirmation email
    $subject = 'Service Booking Confirmation';
    
    // Format booking datetime in IST
    $booking_datetime_formatted = date('F j, Y g:i A T', strtotime($bookingDatetime));
    $current_time = date('F j, Y g:i A T', time());
    
    $message = "
    <html>
    <head>
        <title>Service Booking Confirmation</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
            .booking-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #4CAF50; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>📅 Booking Confirmation 📅</h1>
                <p>Your booking has been received!</p>
            </div>
            <div class='content'>
                <p>Your booking for <strong>{$service['name']}</strong> has been received.</p>
                
                <div class='booking-details'>
                    <h3>Booking Details:</h3>
                    <p><strong>Date:</strong> $booking_datetime_formatted</p>
                    <p><strong>Venue:</strong> {$data['venue']}</p>
                    <p><strong>Address:</strong> {$data['address']}</p>
                </div>
                
                <p>We will review your booking and get back to you soon.</p>
            </div>
            <div class='footer'>
                <p>This email was sent on $current_time</p>
            </div>
        </div>
    </body>
    </html>";

    sendGeneralEmail($data['email'], $subject, $message);

    // Commit transaction
    $pdo->commit();

    // After booking is created, if you return booking details, decrypt phone/address before sending to frontend.
    echo json_encode([
        'success' => true,
        'message' => 'Booking created successfully'
    ]);
} catch (Exception $e) {
    // Rollback transaction on error
    $pdo->rollBack();
    
    echo json_encode([
        'success' => false,
        'error' => 'Failed to create booking'
    ]);
}