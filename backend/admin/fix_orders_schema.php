<?php
require_once '../config/db.php';

try {
    // 1. Drop foreign key if it exists (constraint names vary, so we might need to query it first or just try standard names)
    // This is tricky without knowing the constraint name. 
    // Instead, let's try to Modify the column to be NULLable.
    
    // Attempt 1: Just modify column
    $pdo->exec("ALTER TABLE orders MODIFY COLUMN user_id INT NULL");
    echo "Modified user_id to be NULLable.\n";
    
} catch (PDOException $e) {
    echo "Error modifying user_id: " . $e->getMessage() . "\n";
}
?>
