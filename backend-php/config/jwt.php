<?php

return [
    // Mínimo 32 caracteres. Generar con: php -r "echo bin2hex(random_bytes(48));"
    'secret' => env('JWT_SECRET', ''),
    'minutes' => (int) env('JWT_EXPIRES_MINUTES', 720),
];
