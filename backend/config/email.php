<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Load Composer's autoloader
require_once __DIR__ . '/../vendor/autoload.php';

// Set timezone to IST
date_default_timezone_set('Asia/Kolkata');

define('GMAIL_USER', getenv('SHOPNEST_EMAIL_USER') ?: 'support@shopnest.example.com');
define('GMAIL_PASS', getenv('SHOPNEST_EMAIL_PASS') ?: '');

function sendOTP($email, $otp) {
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = GMAIL_USER;
        $mail->Password = GMAIL_PASS;
        $mail->SMTPSecure = 'tls';
        $mail->Port = 587;
        
        // Set timezone for email headers
        $mail->setLanguage('en', __DIR__ . '/../vendor/phpmailer/phpmailer/language/');
        $mail->CharSet = 'UTF-8';

        $mail->setFrom(GMAIL_USER, 'ShopNest');
        $mail->addAddress($email);
        $mail->isHTML(true);
        $mail->Subject = 'Your OTP Code';
        $mail->Body    = 'Your OTP code is <b>' . $otp . '</b>';

        $mail->send();
        return true;
    } catch (Exception $e) {
        return false;
    }
}

?>
