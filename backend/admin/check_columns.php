<?php
require_once '../config/db.php';

try {
    $stmt = $pdo->query("DESCRIBE orders");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Columns: " . implode(", ", $columns);
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
