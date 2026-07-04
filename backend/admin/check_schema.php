<?php
require_once '../config/db.php';

try {
    $stmt = $pdo->query("DESCRIBE orders");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $col) {
        if ($col['Field'] === 'user_id') {
            echo "Column: " . $col['Field'] . "\n";
            echo "Type: " . $col['Type'] . "\n";
            echo "Null: " . $col['Null'] . "\n"; // Should be YES
            echo "Key: " . $col['Key'] . "\n";
            echo "Default: " . $col['Default'] . "\n";
        }
    }
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
