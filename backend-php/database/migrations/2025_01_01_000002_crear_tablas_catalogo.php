<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Trabajadores (con su historial por local), servicios e inventario. */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('trabajadores')) {
            Schema::create('trabajadores', function (Blueprint $t) {
                $t->char('id', 36)->primary();
                $t->string('nombre');
                $t->string('apellido')->default('');
                $t->string('telefono', 50)->nullable();
                $t->date('fecha_ingreso')->nullable();
                $t->char('local_id', 36);
                $t->foreign('local_id')->references('id')->on('locales')->cascadeOnDelete();
            });
        }
        if (! Schema::hasTable('trabajador_locales')) {
            Schema::create('trabajador_locales', function (Blueprint $t) {
                $t->char('trabajador_id', 36);
                $t->char('local_id', 36);
                $t->string('estado', 10)->default('activo');
                $t->dateTime('desde');
                $t->dateTime('actualizado');
                $t->primary(['trabajador_id', 'local_id']);
                $t->foreign('trabajador_id')->references('id')->on('trabajadores')->cascadeOnDelete();
                $t->foreign('local_id')->references('id')->on('locales')->cascadeOnDelete();
            });
        }
        if (! Schema::hasTable('trabajador_movimientos')) {
            Schema::create('trabajador_movimientos', function (Blueprint $t) {
                $t->char('id', 36)->primary();
                $t->char('trabajador_id', 36);
                $t->char('local_origen', 36)->nullable();
                $t->char('local_destino', 36);
                $t->dateTime('fecha');
                $t->string('motivo')->default('');
                $t->string('usuario')->default('');
                $t->foreign('trabajador_id')->references('id')->on('trabajadores')->cascadeOnDelete();
            });
        }
        if (! Schema::hasTable('servicios')) {
            Schema::create('servicios', function (Blueprint $t) {
                $t->char('id', 36)->primary();
                $t->string('nombre');
                $t->decimal('precio', 10, 2)->default(0);
                $t->decimal('porcentaje_trabajador', 5, 2)->default(50);
                $t->char('local_id', 36);
                $t->foreign('local_id')->references('id')->on('locales')->cascadeOnDelete();
            });
        }
        if (! Schema::hasTable('productos')) {
            Schema::create('productos', function (Blueprint $t) {
                $t->char('id', 36)->primary();
                $t->char('local_id', 36);
                $t->string('nombre');
                $t->integer('stock')->default(0);
                $t->integer('stock_minimo')->default(0);
                $t->decimal('precio', 10, 2)->default(0);
                $t->foreign('local_id')->references('id')->on('locales')->cascadeOnDelete();
            });
        }
    }

    public function down(): void
    {
        foreach (['productos', 'servicios', 'trabajador_movimientos', 'trabajador_locales', 'trabajadores'] as $tabla) {
            Schema::dropIfExists($tabla);
        }
    }
};
