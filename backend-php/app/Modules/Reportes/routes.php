<?php

use App\Modules\Reportes\Infrastructure\Http\ReportesController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth.jwt')->prefix('reportes')->group(function () {
    // Reportes generales (acotados a los locales del usuario)
    Route::middleware(['permiso:reportes.global', 'alcance'])->group(function () {
        Route::get('/trabajadores', [ReportesController::class, 'liquidacion']);
        Route::get('/dashboard', [ReportesController::class, 'dashboard']);
    });
    // Detalle de un local dentro del alcance del usuario
    Route::get('/local/{id}', [ReportesController::class, 'local'])->middleware(['permiso:reportes.local,reportes.global', 'owns.local']);
});
