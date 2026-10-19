<?php

use App\Modules\Productos\Infrastructure\Http\ProductosController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth.jwt', 'permiso:inventario.administrar'])->prefix('productos')->group(function () {
    Route::get('/', [ProductosController::class, 'index'])->middleware('alcance');
    Route::post('/', [ProductosController::class, 'store'])->middleware('local.body');
    Route::put('/{id}', [ProductosController::class, 'update'])->middleware('owns:productos');
    Route::patch('/{id}/stock', [ProductosController::class, 'ajustarStock'])->middleware('owns:productos');
    Route::delete('/{id}', [ProductosController::class, 'destroy'])->middleware('owns:productos');
});
