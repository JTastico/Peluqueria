<?php

use App\Modules\Marca\Infrastructure\Http\MarcaController;
use Illuminate\Support\Facades\Route;

// Público: el tema y el logo se necesitan también en la pantalla de login
Route::prefix('marca')->group(function () {
    Route::get('/', [MarcaController::class, 'show']);
    Route::get('/logo', [MarcaController::class, 'logo']);
});
