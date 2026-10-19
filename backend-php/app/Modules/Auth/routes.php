<?php

use App\Modules\Auth\Infrastructure\Http\AuthController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');

    Route::middleware('auth.jwt')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/cambiar-password', [AuthController::class, 'cambiarPassword']);
        Route::put('/preferencias', [AuthController::class, 'preferencias']);
    });
});
