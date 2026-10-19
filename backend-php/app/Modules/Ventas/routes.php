<?php

use App\Modules\Ventas\Infrastructure\Http\VentasController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth.jwt')->prefix('ventas')->group(function () {
    Route::get('/', [VentasController::class, 'index'])->middleware(['permiso:ventas.ver_local,ventas.registrar', 'alcance']);
    Route::post('/', [VentasController::class, 'store'])->middleware(['permiso:ventas.registrar', 'local.body']);
    Route::patch('/{id}/anular', [VentasController::class, 'anular'])->middleware(['permiso:ventas.anular', 'owns:ventas']);
});
