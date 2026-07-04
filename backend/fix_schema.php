<?php
require_once __DIR__ . '/config/db.php';

function addColumnIfNotExists($pdo, $table, $column, $definition) {
    try {
        $stmt = $pdo->query("DESCRIBE $table");
        $cols = $stmt->fetchAll(PDO::FETCH_COLUMN);
        if (!in_array($column, $cols)) {
            $pdo->exec("ALTER TABLE $table ADD COLUMN $column $definition");
            echo "Added column '$column' to table '$table'.\n";
        } else {
            echo "Column '$column' already exists in table '$table'.\n";
        }
    } catch (Exception $e) {
        echo "Error checking/adding column '$column' to '$table': " . $e->getMessage() . "\n";
    }
}

try {
    // Cart table
    addColumnIfNotExists($pdo, 'cart', 'color_variation_id', 'INT NULL DEFAULT NULL');
    addColumnIfNotExists($pdo, 'cart', 'guest_id', 'VARCHAR(255) NULL DEFAULT NULL');

    // Wishlist table
    addColumnIfNotExists($pdo, 'wishlist', 'color_variation_id', 'INT NULL DEFAULT NULL');
    addColumnIfNotExists($pdo, 'wishlist', 'guest_id', 'VARCHAR(255) NULL DEFAULT NULL');

    // Add indices if they don't exist (basic check mainly to avoid errors if they do)
    try {
        $pdo->exec("CREATE INDEX idx_cart_guest_id ON cart(guest_id)");
        echo "Created index on cart(guest_id).\n";
    } catch (Exception $e) {
        // Build index likely already exists
        echo "Index on cart(guest_id) might already exist: " . $e->getMessage() . "\n";
    }

    try {
        $pdo->exec("CREATE INDEX idx_wishlist_guest_id ON wishlist(guest_id)");
        echo "Created index on wishlist(guest_id).\n";
    } catch (Exception $e) {
        echo "Index on wishlist(guest_id) might already exist: " . $e->getMessage() . "\n";
    }

} catch (Exception $e) {
    echo "General error: " . $e->getMessage() . "\n";
}
?>
