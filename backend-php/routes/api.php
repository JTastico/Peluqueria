<?php

use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['status' => 'ok']));

// Cada módulo declara sus propias rutas junto a su código
Route::middleware('throttle:api')->group(function () {
    foreach (['Auth', 'Marca', 'Locales', 'Trabajadores', 'Servicios', 'Productos', 'Ventas', 'Reportes', 'Configuracion', 'Roles', 'Usuarios'] as $modulo) {
        require app_path("Modules/{$modulo}/routes.php");
    }
});
