<?php

use App\Modules\Configuracion\Infrastructure\Http\ConfiguracionController;
use App\Modules\Marca\Infrastructure\Http\MarcaController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth.jwt')->prefix('configuracion')->group(function () {
    Route::get('/', [ConfiguracionController::class, 'show'])->middleware('permiso:configuracion.ver');

    Route::middleware('permiso:configuracion.administrar')->group(function () {
        Route::put('/', [ConfiguracionController::class, 'update']);
        Route::put('/tema', [MarcaController::class, 'guardarTema']);
        Route::put('/logo', [MarcaController::class, 'guardarLogo']);
        Route::delete('/logo', [MarcaController::class, 'eliminarLogo']);
    });
});
