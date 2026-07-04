<?php
// This file should NOT set headers or process raw input directly.
// It should be included and its functions called by other scripts.

// Set timezone to IST
date_default_timezone_set('Asia/Kolkata');

// We only need database for fetching data within the email templates if needed,
// but the main data should be passed as arguments.
// require_once __DIR__ . '/../config/db.php'; // Uncomment if template functions need DB access
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/email.php'; // For GMAIL_USER/PASS

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

/**
 * Sends an email using PHPMailer.
 *
 * @param string $to The recipient email address.
 * @param string $subject The email subject.
 * @param string $body The email body (HTML content).
 * @return bool True on success, false on failure.
 */
function sendGeneralEmail($to, $subject, $body) {
    $mail = new PHPMailer(true);

    try {
        // Server settings from config/email.php
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com'; // Update with your SMTP host
        $mail->SMTPAuth = true;
        $mail->Username = GMAIL_USER; // Your Gmail address
        $mail->Password = GMAIL_PASS; // Your Gmail App Password
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS; // Use STARTTLS
        $mail->Port = 587; // Use port 587
        
        // Set timezone and character encoding
        $mail->setLanguage('en', __DIR__ . '/../vendor/phpmailer/phpmailer/language/');
        $mail->CharSet = 'UTF-8';

        // Recipients
        $mail->setFrom(GMAIL_USER, 'ShopNest'); // Sender
        $mail->addAddress($to); // Recipient

        // Content
        $mail->isHTML(true); // Set email format to HTML
        $mail->Subject = $subject;
        $mail->Body    = $body;
        $mail->AltBody = strip_tags($body); // Plain text for non-HTML mail clients

        $mail->send();
        // Log successful send (optional, but good for debugging)
        error_log("Email sent successfully to: " . $to . " with subject: " . $subject);
        return true;
    } catch (Exception $e) {
        // Log detailed error
        error_log("Email sending failed to " . $to . " (" . $subject . "): " . $mail->ErrorInfo . " | Exception: " . $e->getMessage());
        return false;
    }
}

/**
 * Generates and sends an order confirmation email.
 *
 * @param array $data Associative array containing email data (to, subject, order_id, total_amount, items).
 *                   Items array should have keys: product_name, quantity, price.
 * @return bool True on success, false on failure.
 */
function sendOrderConfirmationEmail($data) {
    $to = $data['to'];
    $subject = $data['subject'];
    $phone = isset($data['phone']) ? $data['phone'] : '';
    $shipping_address = isset($data['shipping_address']) ? $data['shipping_address'] : '';
    $billing_address = isset($data['billing_address']) ? $data['billing_address'] : '';
    $image_url = isset($data['image_url']) && $data['image_url'] ? (strpos($data['image_url'], 'http') === 0 ? $data['image_url'] : 'https://shopnest.example.com/backend/' . ltrim($data['image_url'], '/')) : 'https://shopnest.example.com/public/default-image.png';
    
    // Format current time in IST
    $current_time = date('F j, Y g:i A T', time());

    $message_body = "
    <html>
    <head>
        <title>Order Confirmation</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff6b9d, #c44569); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
            .order-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #ff6b9d; }
            .item { background: white; padding: 10px; margin: 5px 0; border-radius: 5px; border: 1px solid #eee; }
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
                <p>Your order has been received and is being processed.</p>
                
                <div class='order-details'>
                    <h3>Order Details:</h3>
                    <p><strong>Order ID:</strong> {$data['order_id']}</p>
                    <p><strong>Total Amount:</strong> ₹{$data['total_amount']}</p>
                    <p><strong>Phone:</strong> $phone</p>
                    <p><strong>Shipping Address:</strong> $shipping_address</p>
                    <p><strong>Billing Address:</strong> $billing_address</p>
                    <p><strong>Order Date:</strong> $current_time</p>
                </div>
                
                <img src='$image_url' alt='Product Image' style='max-width:200px; border-radius: 10px;'/><br>
                
                <h4>Items:</h4>";

    // Use 'product_name' key which is fetched in create_order.php
    foreach ($data['items'] as $item) {
        $message_body .= "<div class='item'><strong>{$item['product_name']}</strong> x {$item['quantity']} - ₹" . ($item['price'] * $item['quantity']) . "</div>";
    }

    $message_body .= "
                <p>We will notify you when your order ships.</p>
                <p>Thank you for shopping with ShopNest!!🎈😊</p>
            </div>
            <div class='footer'>
                <p>This email was sent on $current_time</p>
            </div>
        </div>
    </body>
    </html>";

    // Use the robust sendGeneralEmail function
    return sendGeneralEmail($to, $subject, $message_body);
}

/**
 * Generates and sends a payment confirmation email.
 *
 * @param array $data Associative array containing email data (to, subject, order_id, payment_id, total_amount, items).
 *                   Items array should have keys: product_name, quantity, price.
 * @return bool True on success, false on failure.
 */
function sendPaymentConfirmationEmail($data) {
    $to = $data['to'];
    $subject = $data['subject'];
    
    // Format current time in IST
    $current_time = date('F j, Y g:i A T', time());

    $message_body = "
    <html>
    <head>
        <title>Payment Confirmation</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
            .payment-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #4CAF50; }
            .item { background: white; padding: 10px; margin: 5px 0; border-radius: 5px; border: 1px solid #eee; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>✅ Payment Confirmed! ✅</h1>
                <p>Your payment has been successfully processed.</p>
            </div>
            <div class='content'>
                <div class='payment-details'>
                    <h3>Payment Details:</h3>
                    <p><strong>Order ID:</strong> {$data['order_id']}</p>
                    <p><strong>Payment ID:</strong> {$data['payment_id']}</p>
                    <p><strong>Total Amount:</strong> ₹{$data['total_amount']}</p>
                    <p><strong>Payment Date:</strong> $current_time</p>
                </div>
                
                <h4>Items:</h4>";

     // Use 'product_name' key which should be fetched in confirm_payment.php
    foreach ($data['items'] as $item) {
        $message_body .= "<div class='item'><strong>{$item['product_name']}</strong> x {$item['quantity']} - ₹" . ($item['price'] * $item['quantity']) . "</div>";
    }

    $message_body .= "
                <p>Your order will be shipped soon.</p>
                <p>Thank you for shopping with ShopNest!!😀🎉</p>
            </div>
            <div class='footer'>
                <p>This email was sent on $current_time</p>
            </div>
        </div>
    </body>
    </html>";

    // Use the robust sendGeneralEmail function
    return sendGeneralEmail($to, $subject, $message_body);
}
?>