<?php

use App\Modules\Roles\Infrastructure\Http\RolesController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth.jwt', 'permiso:usuarios.administrar'])->prefix('roles')->group(function () {
    Route::get('/', [RolesController::class, 'index']);
    Route::post('/', [RolesController::class, 'store']);
    Route::put('/{id}', [RolesController::class, 'update'])->where('id', '[a-z0-9_]{1,40}');
    Route::delete('/{id}', [RolesController::class, 'destroy'])->where('id', '[a-z0-9_]{1,40}');
});
