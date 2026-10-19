<?php

return [
    // Peticiones por minuto y por IP
    'rate_limit' => (int) env('RATE_LIMIT_MAX', 300),
    // Detrás de un proxy inverso: IPs de confianza separadas por coma, o * (vacío = sin proxy)
    'proxies' => env('TRUSTED_PROXIES', ''),

    // Administrador inicial (solo lo lee el seeder). Si la contraseña está vacía se genera una al azar.
    'admin_usuario' => env('ADMIN_USERNAME', 'admin'),
    'admin_password' => env('ADMIN_PASSWORD', ''),
    // Datos de ejemplo (solo desarrollo)
    'seed_demo' => (bool) env('SEED_DEMO', false),
];
