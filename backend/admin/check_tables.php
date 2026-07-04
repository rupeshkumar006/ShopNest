<?php
require_once '../config/db.php';

try {
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Tables in $dbname:<br>";
    foreach ($tables as $table) {
        echo $table . "<br>";
    }
    
    echo "<br>Checking specific table schema:<br>";
    try {
        $stmt = $pdo->query("DESCRIBE product_color_variations");
        echo "product_color_variations exists.<br>";
    } catch (PDOException $e) {
        echo "product_color_variations DOES NOT EXIST: " . $e->getMessage() . "<br>";
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
