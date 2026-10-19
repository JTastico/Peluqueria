<?php

use App\Modules\Trabajadores\Infrastructure\TrabajadoresController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth.jwt')->prefix('trabajadores')->group(function () {
    // Quien cobra necesita la lista de trabajadores para atribuirles los servicios
    Route::get('/', [TrabajadoresController::class, 'index'])->middleware(['permiso:trabajadores.ver', 'alcance']);
    Route::get('/{id}/historial', [TrabajadoresController::class, 'historial'])->middleware('permiso:trabajadores.ver');

    Route::post('/', [TrabajadoresController::class, 'store'])->middleware(['permiso:trabajadores.administrar', 'local.body']);
    Route::delete('/{id}', [TrabajadoresController::class, 'destroy'])->middleware(['permiso:trabajadores.administrar', 'owns:trabajadores']);

    Route::middleware(['permiso:trabajadores.transferir', 'owns:trabajadores'])->group(function () {
        Route::post('/{id}/transferir', [TrabajadoresController::class, 'transferir']);
        Route::post('/{id}/locales', [TrabajadoresController::class, 'agregarALocal']);
        Route::patch('/{id}/locales/{localId}', [TrabajadoresController::class, 'cambiarEstado'])->whereUuid('localId');
    });
});
