<?php
require_once __DIR__ . '/../config/db.php';

try {
    echo "Existing tables:\n";
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    print_r($tables);

    if (in_array('coupons', $tables)) {
        echo "\nCoupons Table Schema:\n";
        $stmt = $pdo->query("DESCRIBE coupons");
        print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
    
    if (in_array('coupon_usages', $tables)) {
         echo "\nCoupon Usages Table Schema:\n";
         $stmt = $pdo->query("DESCRIBE coupon_usages");
         print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
    } else {
        echo "\ncoupon_usages table NOT found.\n";
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
