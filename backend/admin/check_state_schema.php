<?php
require_once '../config/db.php';

try {
    $stmt = $pdo->query("DESCRIBE orders");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $col) {
        if (in_array($col['Field'], ['shipping_state', 'billing_state', 'guest_id'])) {
            echo "Column: " . $col['Field'] . "\n";
            echo "Null: " . $col['Null'] . "\n";
            echo "Default: " . $col['Default'] . "\n\n";
        }
    }
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
