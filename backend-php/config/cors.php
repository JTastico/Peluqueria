<?php

// Solo el origen exacto del frontend (FRONTEND_ORIGIN, varios separados por coma). Sin cookies.
return [
    'paths' => ['api/*'],
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    'allowed_origins' => array_map('trim', explode(',', env('FRONTEND_ORIGIN', 'http://localhost:8080'))),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['Authorization', 'Content-Type', 'Accept'],
    'exposed_headers' => [],
    'max_age' => 600,
    'supports_credentials' => false,
];
