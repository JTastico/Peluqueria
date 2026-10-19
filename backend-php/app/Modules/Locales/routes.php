<?php

use App\Modules\Locales\Infrastructure\LocalesController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth.jwt')->prefix('locales')->group(function () {
    Route::get('/', [LocalesController::class, 'index'])->middleware(['permiso:locales.ver', 'alcance']);
    Route::get('/{id}', [LocalesController::class, 'show'])->middleware(['permiso:locales.ver', 'owns.local']);
    Route::post('/', [LocalesController::class, 'store'])->middleware('permiso:locales.administrar');
    Route::delete('/{id}', [LocalesController::class, 'destroy'])->middleware('permiso:locales.administrar');
});
