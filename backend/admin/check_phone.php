<?php
require_once '../config/db.php';

try {
    $stmt = $pdo->query("DESCRIBE orders");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $col) {
        if ($col['Field'] === 'phone') {
            echo "Column: " . $col['Field'] . "\n";
            echo "Type: " . $col['Type'] . "\n";
        }
    }
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
