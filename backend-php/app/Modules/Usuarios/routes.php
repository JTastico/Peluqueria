<?php

use App\Modules\Usuarios\Infrastructure\Http\UsuariosController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth.jwt', 'permiso:usuarios.administrar'])->prefix('usuarios')->group(function () {
    Route::get('/', [UsuariosController::class, 'index']);
    Route::put('/{id}', [UsuariosController::class, 'update']);
});
