<?php
require_once '../cors.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
require_once __DIR__ . '/../config/email.php';
require_once __DIR__ . '/../config/db.php';

// Set timezone to IST
date_default_timezone_set('Asia/Kolkata');

function sendOrderConfirmation($userId) {
    global $pdo;
    $stmt = $pdo->prepare("SELECT u.email, u.name, o.id as order_id, o.total_price, o.status FROM users u JOIN orders o ON u.id = o.user_id WHERE u.id = ? ORDER BY o.created_at DESC LIMIT 1");
    $stmt->execute([$userId]);
    $order = $stmt->fetch();
    if ($order) {
        $mail = new PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host = 'smtp.gmail.com';
            $mail->SMTPAuth = true;
            $mail->Username = GMAIL_USER;
            $mail->Password = GMAIL_PASS;
            $mail->SMTPSecure = 'tls';
            $mail->Port = 587;
            
            // Set timezone and character encoding
            $mail->setLanguage('en', __DIR__ . '/../vendor/phpmailer/phpmailer/language/');
            $mail->CharSet = 'UTF-8';
            
            $mail->setFrom(GMAIL_USER, 'ShopNest');
            $mail->addAddress($order['email'], $order['name']);
            $mail->isHTML(true);
            $mail->Subject = 'Order Confirmation';
            
            // Format current time in IST
            $current_time = date('F j, Y g:i A T', time());
            
            $mail->Body = "
            <html>
            <head>
                <title>Order Confirmation</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #ff6b9d, #c44569); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
                    .order-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #ff6b9d; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>🎈 Order Confirmation 🎈</h1>
                        <p>Thank you for your order!</p>
                    </div>
                    <div class='content'>
                        <p>Hi <b>{$order['name']}</b>,</p>
                        <div class='order-details'>
                            <h3>Order Details:</h3>
                            <p><strong>Order ID:</strong> #{$order['order_id']}</p>
                            <p><strong>Status:</strong> {$order['status']}</p>
                            <p><strong>Total:</strong> ₹{$order['total_price']}</p>
                            <p><strong>Order Date:</strong> $current_time</p>
                        </div>
                        <p>Thanks for choosing ShopNest🎈</p>
                    </div>
                    <div class='footer'>
                        <p>This email was sent on $current_time</p>
                    </div>
                </div>
            </body>
            </html>";
            
            $mail->send();
        } catch (Exception $e) {
            error_log("Order confirmation email failed: {$mail->ErrorInfo}");
        }
    }
}

function sendBookingConfirmation($userId) {
    global $pdo;
    $stmt = $pdo->prepare("SELECT u.email, u.name, u.phone, b.id as booking_id, b.booking_datetime, b.address, b.venue, b.notes, s.name as service_name, s.image_url as service_image 
        FROM users u 
        JOIN bookings b ON u.id = b.user_id 
        JOIN services s ON b.service_id = s.id 
        WHERE u.id = ? 
        ORDER BY b.created_at DESC LIMIT 1");
    $stmt->execute([$userId]);
    $booking = $stmt->fetch();
    if ($booking) {
        // Decrypt phone if needed
        require_once __DIR__ . '/../config/encryption.php';
        $phone = $booking['phone'] ?? '';
        if (!empty($phone)) {
            $current_value = $phone;
            $max_attempts = 5;
            for ($i = 0; $i < $max_attempts; $i++) {
                $decrypted = decrypt_data($current_value);
                if ($decrypted === '' || $decrypted === $current_value) break;
                $current_value = $decrypted;
            }
            $phone = $current_value !== $booking['phone'] ? $current_value : '';
        }
        // Absolute/default image URL
        $serviceImage = $booking['service_image'] && strpos($booking['service_image'], 'http') === 0
            ? $booking['service_image']
            : ($booking['service_image'] ? 'https://shopnest.example.com/backend/' . ltrim($booking['service_image'], '/') : 'https://shopnest.example.com/public/default-image.png');
        
        // Format booking datetime in IST
        $booking_datetime = date('F j, Y g:i A T', strtotime($booking['booking_datetime']));
        $current_time = date('F j, Y g:i A T', time());
        
        $mail = new PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host = 'smtp.gmail.com';
            $mail->SMTPAuth = true;
            $mail->Username = GMAIL_USER;
            $mail->Password = GMAIL_PASS;
            $mail->SMTPSecure = 'tls';
            $mail->Port = 587;
            
            // Set timezone and character encoding
            $mail->setLanguage('en', __DIR__ . '/../vendor/phpmailer/phpmailer/language/');
            $mail->CharSet = 'UTF-8';
            
            $mail->setFrom(GMAIL_USER, 'ShopNest');
            $mail->addAddress($booking['email'], $booking['name']);
            $mail->isHTML(true);
            $mail->Subject = 'Booking Confirmation';
            $mail->Body = "
            <html>
            <head>
                <title>Booking Confirmation</title>
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
                        <p>Thank you for your booking!</p>
                    </div>
                    <div class='content'>
                        <h2>Thank you for your booking, {$booking['name']}!</h2>
                        
                        <div class='booking-details'>
                            <h3>Booking Details:</h3>
                            <p><strong>Service:</strong> {$booking['service_name']}</p>
                            <p><strong>Date & Time:</strong> $booking_datetime</p>
                            <p><strong>Phone:</strong> $phone</p>
                            <p><strong>Address:</strong> {$booking['address']}</p>
                            <p><strong>Venue:</strong> {$booking['venue']}</p>
                            <p><strong>Notes:</strong> {$booking['notes']}</p>
                        </div>
                        
                        <p>We look forward to serving you!</p>
                    </div>
                    <div class='footer'>
                        <p>This email was sent on $current_time</p>
                    </div>
                </div>
            </body>
            </html>";
            
            $mail->send();
        } catch (Exception $e) {
            error_log("Booking confirmation email failed: {$mail->ErrorInfo}");
        }
    }
}
?>
