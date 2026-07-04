<?php
// Define a secret key and method for encryption.
// IMPORTANT: This key should be stored securely and not be hardcoded
// in a real production environment. For this project, we'll define it here.
define('ENCRYPTION_KEY', getenv('SHOPNEST_ENCRYPTION_KEY') ?: 'your-super-secret-key-32-bytes-long'); // MUST be 32 bytes
define('ENCRYPTION_METHOD', 'aes-256-cbc');

/**
 * Encrypts a string.
 *
 * @param string $string The string to encrypt.
 * @return string The encrypted string, base64 encoded.
 */
function encrypt_data($string) {
    if (!is_string($string)) {
        error_log("encrypt_data: input is not a string: " . var_export($string, true));
        $string = strval($string);
    }
    $iv_length = openssl_cipher_iv_length(ENCRYPTION_METHOD);
    $iv = openssl_random_pseudo_bytes($iv_length);
    $encrypted = openssl_encrypt($string, ENCRYPTION_METHOD, ENCRYPTION_KEY, 0, $iv);
    if ($encrypted === false) {
        error_log("encrypt_data: openssl_encrypt failed for input: " . var_export($string, true));
        return '';
    }
    // Prepend the IV to the encrypted string for use in decryption.
    return base64_encode($iv . $encrypted);
}

/**
 * Decrypts a string.
 *
 * @param string $encrypted_string The base64 encoded encrypted string.
 * @return string|false The decrypted string, or false on failure.
 */
function decrypt_data($encrypted_string) {
    // If the input is empty or does not appear to be base64, it cannot be decrypted.
    if (empty($encrypted_string) || base64_decode($encrypted_string, true) === false) {
        return '';
    }

    $data = base64_decode($encrypted_string);
    $iv_length = openssl_cipher_iv_length(ENCRYPTION_METHOD);

    // If the data is not long enough for an IV and content, it's invalid.
    if (strlen($data) < $iv_length + 1) {
        return '';
    }

    $iv = substr($data, 0, $iv_length);
    $encrypted = substr($data, $iv_length);
    
    // The openssl_decrypt function itself returns false on any error.
    $decrypted = openssl_decrypt($encrypted, ENCRYPTION_METHOD, ENCRYPTION_KEY, 0, $iv);
    return $decrypted === false ? '' : $decrypted;
}

/**
 * Robustly decrypts a value up to 5 times and validates the result.
 * @param string $value The value to decrypt.
 * @param string $type The type of data: 'name', 'phone', or 'text'.
 * @return string The decrypted and validated value, or fallback ('Anonymous' for name, '' for phone/text).
 */
function robust_decrypt($value, $type = 'text') {
    $max_attempts = 5;
    // Normalize to string to avoid passing null to functions like preg_match
    $current = (string)($value ?? '');
    for ($i = 0; $i < $max_attempts; $i++) {
        $decrypted = decrypt_data($current);
        if ($decrypted === '' || $decrypted === $current) break;
        $current = $decrypted;
    }
    if ($type === 'name') {
        // If still base64, not valid UTF-8, or too long, treat as invalid
        $is_utf8 = mb_check_encoding((string)$current, 'UTF-8');
        // Stricter base64 check: only treat as base64 if length >= 8, length is a multiple of 4, and matches the base64 regex
        $is_base64 = (strlen($current) >= 8 && strlen($current) % 4 === 0 && preg_match('/^[A-Za-z0-9+\/]+=*$/', $current));
        $is_too_long = strlen($current) > 40;
        if ($is_utf8 && !$is_base64 && !$is_too_long) {
            return $current;
        } else {
            // Debug log for why 'Anonymous' is returned
            file_put_contents(__DIR__ . '/robust_decrypt_debug.log', date('c') . " | name='$current' | utf8=$is_utf8 | base64=$is_base64 | too_long=$is_too_long\n", FILE_APPEND);
            return 'Anonymous';
        }
    }
    if ($type === 'phone') {
        // Ensure string value before regex checks
        $current = (string)($current ?? '');
        // Accept +91XXXXXXXXXX or 10 digits
        if (preg_match('/^\+91\d{10}$/', $current)) {
            return $current;
        }
        if (preg_match('/^\d{10}$/', $current)) {
            return '+91' . $current;
        }
        return '';
    }
    // For address/text, just return the result (or empty if not valid)
    if (!mb_check_encoding((string)$current, 'UTF-8')) {
        return '';
    }
    return $current;
}
?> 