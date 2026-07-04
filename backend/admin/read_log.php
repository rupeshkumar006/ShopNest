<?php
$file = __DIR__ . '/../payments/payment_error.log';
if (file_exists($file)) {
    echo "File size: " . filesize($file) . "\n";
    echo "Content:\n";
    echo file_get_contents($file);
} else {
    echo "Log file not found.";
}
?>
