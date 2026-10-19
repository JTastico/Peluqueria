<?php

use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['status' => 'ok']));

// Cada módulo declara sus rutas en app/Modules/<Modulo>/routes.php
Route::middleware('throttle:api')->group(function () {
    foreach (['Auth', 'Usuarios', 'Roles', 'Locales', 'Trabajadores', 'Servicios', 'Productos', 'Ventas', 'Reportes', 'Configuracion'] as $modulo) {
        require app_path("Modules/{$modulo}/routes.php");
    }
});
