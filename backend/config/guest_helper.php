<?php
function get_guest_id() {
    $headers = getallheaders();
    $guest_id = isset($headers['Guest-ID']) ? $headers['Guest-ID'] : null;
    
    // Fallback for case-insensitive headers if needed, though getallheaders usually returns mixed case or specific case depending on server
    if (!$guest_id) {
        $guest_id = isset($headers['guest-id']) ? $headers['guest-id'] : null;
    }
    
    return $guest_id;
}
?>
