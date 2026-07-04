<?php
header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/config/db.php';

try {
    $pdo->beginTransaction();
    
    // Get current table structure
    $stmt = $pdo->query("DESCRIBE orders");
    $existingColumns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $changes = [];
    $errors = [];
    
    // Check and add subtotal column if it doesn't exist
    if (!in_array('subtotal', $existingColumns)) {
        try {
            $pdo->exec("ALTER TABLE orders ADD COLUMN subtotal DECIMAL(10,2) DEFAULT 0.00 AFTER total_amount");
            $changes[] = "Added subtotal column";
        } catch (Exception $e) {
            $errors[] = "Failed to add subtotal column: " . $e->getMessage();
        }
    } else {
        $changes[] = "subtotal column already exists";
    }
    
    // Check and add platform_fee column if it doesn't exist
    if (!in_array('platform_fee', $existingColumns)) {
        try {
            $pdo->exec("ALTER TABLE orders ADD COLUMN platform_fee DECIMAL(10,2) DEFAULT 0.00 AFTER subtotal");
            $changes[] = "Added platform_fee column";
        } catch (Exception $e) {
            $errors[] = "Failed to add platform_fee column: " . $e->getMessage();
        }
    } else {
        $changes[] = "platform_fee column already exists";
    }
    
    // Check and add delivery_charge column if it doesn't exist
    if (!in_array('delivery_charge', $existingColumns)) {
        try {
            $pdo->exec("ALTER TABLE orders ADD COLUMN delivery_charge DECIMAL(10,2) DEFAULT 0.00 AFTER platform_fee");
            $changes[] = "Added delivery_charge column";
        } catch (Exception $e) {
            $errors[] = "Failed to add delivery_charge column: " . $e->getMessage();
        }
    } else {
        $changes[] = "delivery_charge column already exists";
    }
    
    // Check and add shipping_state column if it doesn't exist
    if (!in_array('shipping_state', $existingColumns)) {
        try {
            $pdo->exec("ALTER TABLE orders ADD COLUMN shipping_state VARCHAR(100) DEFAULT NULL AFTER delivery_charge");
            $changes[] = "Added shipping_state column";
        } catch (Exception $e) {
            $errors[] = "Failed to add shipping_state column: " . $e->getMessage();
        }
    } else {
        $changes[] = "shipping_state column already exists";
    }
    
    // Check and add billing_state column if it doesn't exist
    if (!in_array('billing_state', $existingColumns)) {
        try {
            $pdo->exec("ALTER TABLE orders ADD COLUMN billing_state VARCHAR(100) DEFAULT NULL AFTER shipping_state");
            $changes[] = "Added billing_state column";
        } catch (Exception $e) {
            $errors[] = "Failed to add billing_state column: " . $e->getMessage();
        }
    } else {
        $changes[] = "billing_state column already exists";
    }

    // --- Guest Support Schema Updates ---

    // 1. Add guest_id to cart
    if (!in_array('guest_id', $existingColumns)) { // Note: existingColumns is only for orders, we should really check each table properly, but for this script let's just use try-catch or describe for each.
         // Let's do it robustly.
    }
    
    // Helper to check column existence
    function columnExists($pdo, $table, $column) {
        try {
            $stmt = $pdo->query("DESCRIBE $table");
            $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
            return in_array($column, $columns);
        } catch (Exception $e) { return false; }
    }

    // Cart Table Updates
    if (!columnExists($pdo, 'cart', 'guest_id')) {
        try {
            $pdo->exec("ALTER TABLE cart ADD COLUMN guest_id VARCHAR(255) NULL AFTER user_id");
            $pdo->exec("ALTER TABLE cart ADD INDEX (guest_id)");
            $changes[] = "Added guest_id to cart";
        } catch (Exception $e) { $errors[] = "Failed to add guest_id to cart: " . $e->getMessage(); }
    }
    try {
        $pdo->exec("ALTER TABLE cart MODIFY COLUMN user_id INT NULL");
        $changes[] = "Made user_id nullable in cart";
    } catch (Exception $e) { $errors[] = "Failed to make user_id nullable in cart: " . $e->getMessage(); }

    // Wishlist Table Updates
    if (!columnExists($pdo, 'wishlist', 'guest_id')) {
        try {
            $pdo->exec("ALTER TABLE wishlist ADD COLUMN guest_id VARCHAR(255) NULL AFTER user_id");
             $pdo->exec("ALTER TABLE wishlist ADD INDEX (guest_id)");
            $changes[] = "Added guest_id to wishlist";
        } catch (Exception $e) { $errors[] = "Failed to add guest_id to wishlist: " . $e->getMessage(); }
    }
    try {
        $pdo->exec("ALTER TABLE wishlist MODIFY COLUMN user_id INT NULL");
        $changes[] = "Made user_id nullable in wishlist";
    } catch (Exception $e) { $errors[] = "Failed to make user_id nullable in wishlist: " . $e->getMessage(); }

    // Orders Table Updates
    if (!columnExists($pdo, 'orders', 'guest_id')) {
        try {
            $pdo->exec("ALTER TABLE orders ADD COLUMN guest_id VARCHAR(255) NULL AFTER user_id");
             $pdo->exec("ALTER TABLE orders ADD INDEX (guest_id)");
            $changes[] = "Added guest_id to orders";
        } catch (Exception $e) { $errors[] = "Failed to add guest_id to orders: " . $e->getMessage(); }
    }
    try {
        $pdo->exec("ALTER TABLE orders MODIFY COLUMN user_id INT NULL");
        $changes[] = "Made user_id nullable in orders";
    } catch (Exception $e) { $errors[] = "Failed to make user_id nullable in orders: " . $e->getMessage(); }


    // Update existing orders to set default values
    if (empty($errors)) {
        try {
            $stmt = $pdo->prepare("
                UPDATE orders 
                SET subtotal = total_amount,
                    platform_fee = 0.00,
                    delivery_charge = 0.00
                WHERE subtotal IS NULL OR platform_fee IS NULL OR delivery_charge IS NULL
            ");
            $stmt->execute();
            $updatedRows = $stmt->rowCount();
            $changes[] = "Updated $updatedRows existing orders with default values";
        } catch (Exception $e) {
            $errors[] = "Failed to update existing orders: " . $e->getMessage();
        }
    }
    
    if (empty($errors)) {
        $result = [
            'success' => true,
            'message' => 'Database schema updated successfully',
            'changes' => $changes,
            'summary' => [
                'total_changes' => count($changes),
                'errors' => 0
            ]
        ];
    } else {
        // No transaction to rollback here as we didn't start one in the main scope for DDLs
        $result = [
            'success' => false,
            'message' => 'Database schema update failed',
            'changes' => $changes,
            'errors' => $errors,
            'summary' => [
                'total_changes' => count($changes),
                'errors' => count($errors)
            ]
        ];
    }
    
    echo json_encode($result, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    echo json_encode([
        'success' => false,
        'error' => 'Database update failed: ' . $e->getMessage()
    ]);
}
?>
