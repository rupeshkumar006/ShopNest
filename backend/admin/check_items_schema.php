<?php
require_once '../config/db.php';

try {
    $stmt = $pdo->query("DESCRIBE order_items");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Columns: " . implode(", ", $columns);
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
