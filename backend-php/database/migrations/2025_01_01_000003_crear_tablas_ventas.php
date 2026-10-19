<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Ventas y sus servicios, con el reparto trabajador/local congelado al momento de cobrar. */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('ventas')) {
            Schema::create('ventas', function (Blueprint $t) {
                $t->char('id', 36)->primary();
                $t->char('local_id', 36);
                $t->dateTime('fecha_hora');
                $t->decimal('total', 10, 2);
                $t->string('metodo_pago', 30)->default('efectivo');
                $t->string('estado', 10)->default('activa');
                $t->string('registrado_por')->default('');
                $t->dateTime('creado');
                $t->foreign('local_id')->references('id')->on('locales')->cascadeOnDelete();
            });
        }
        if (! Schema::hasTable('venta_items')) {
            Schema::create('venta_items', function (Blueprint $t) {
                $t->char('id', 36)->primary();
                $t->char('venta_id', 36);
                $t->char('servicio_id', 36)->nullable();
                $t->string('servicio_nombre');
                $t->char('trabajador_id', 36)->nullable();
                $t->string('trabajador_nombre');
                $t->decimal('precio', 10, 2);
                $t->decimal('porcentaje_trabajador', 5, 2);
                $t->decimal('monto_trabajador', 10, 2);
                $t->decimal('monto_local', 10, 2);
                $t->foreign('venta_id')->references('id')->on('ventas')->cascadeOnDelete();
                $t->foreign('servicio_id')->references('id')->on('servicios')->nullOnDelete();
                $t->foreign('trabajador_id')->references('id')->on('trabajadores')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('venta_items');
        Schema::dropIfExists('ventas');
    }
};
