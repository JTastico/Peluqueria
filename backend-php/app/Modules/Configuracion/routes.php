<?php

use App\Modules\Configuracion\Infrastructure\ConfiguracionController as C;
use Illuminate\Support\Facades\Route;

// Público: el tema y el logo se necesitan también en la pantalla de login
Route::get('/marca', [C::class, 'marca']);
Route::get('/marca/logo', [C::class, 'logo']);

Route::middleware('auth.jwt')->prefix('configuracion')->group(function () {
    Route::get('/', [C::class, 'show'])->middleware('permiso:configuracion.ver');

    Route::middleware('permiso:configuracion.administrar')->group(function () {
        Route::put('/', [C::class, 'update']);
        Route::put('/tema', [C::class, 'guardarTema']);
        Route::put('/logo', [C::class, 'guardarLogo']);
        Route::delete('/logo', [C::class, 'eliminarLogo']);
    });
});
