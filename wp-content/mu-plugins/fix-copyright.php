<?php
/**
 * Fix copyright text in footer.
 * Replaces garbled © symbol and 2025 year with © 2026.
 */
add_action('wp_head', function() {
    ob_start(function($buffer) {
        $buffer = str_replace(
            ['ï¿½ 2025 Light of Life Global All Rights Reserved.', 'ï¿½ 2025', '&#169; 2025', '&copy; 2025', '© 2025'],
            ['© 2026 Light of Life Global. All Rights Reserved.', '© 2026', '© 2026', '© 2026', '© 2026'],
            $buffer
        );
        return $buffer;
    });
}, 1);

add_action('shutdown', function() {
    if (ob_get_level() > 0) {
        ob_end_flush();
    }
}, 0);
