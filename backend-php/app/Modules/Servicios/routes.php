<?php

use App\Modules\Servicios\Infrastructure\Http\ServiciosController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth.jwt')->prefix('servicios')->group(function () {
    // Quien cobra necesita ver los servicios y sus precios
    Route::get('/', [ServiciosController::class, 'index'])->middleware(['permiso:servicios.ver,servicios.administrar', 'alcance']);

    Route::middleware('permiso:servicios.administrar')->group(function () {
        Route::post('/', [ServiciosController::class, 'store']);
        Route::put('/{id}', [ServiciosController::class, 'update'])->middleware('owns:servicios');
        Route::delete('/{id}', [ServiciosController::class, 'destroy'])->middleware('owns:servicios');
    });
});
