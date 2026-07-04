<?php
// Razorpay configuration
define('RAZORPAY_KEY', getenv('SHOPNEST_RAZORPAY_KEY') ?: '');
define('RAZORPAY_SECRET', getenv('SHOPNEST_RAZORPAY_SECRET') ?: '');

// Load Razorpay SDK via autoloader
require_once __DIR__ . '/../vendor/autoload.php';
?>