<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Roles, permisos, locales, usuarios y configuración. */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('roles')) {
            Schema::create('roles', function (Blueprint $t) {
                $t->string('id', 40)->primary();
                $t->string('nombre', 80);
                $t->string('descripcion')->default('');
                $t->string('alcance', 10)->default('local');
                $t->boolean('es_sistema')->default(false);
            });
        }
        if (! Schema::hasTable('rol_permisos')) {
            Schema::create('rol_permisos', function (Blueprint $t) {
                $t->string('rol_id', 40);
                $t->string('permiso', 60);
                $t->primary(['rol_id', 'permiso']);
                $t->foreign('rol_id')->references('id')->on('roles')->cascadeOnDelete();
            });
        }
        if (! Schema::hasTable('locales')) {
            Schema::create('locales', function (Blueprint $t) {
                $t->char('id', 36)->primary();
                $t->string('type', 50);
                $t->string('nombre');
                $t->string('direccion')->nullable();
                $t->string('telefono', 50)->nullable();
                $t->string('horario', 100)->nullable();
                $t->string('imagen')->nullable();
                $t->string('estado', 50)->default('Activo');
                $t->string('username')->nullable();
            });
        }
        if (! Schema::hasTable('users')) {
            Schema::create('users', function (Blueprint $t) {
                $t->char('id', 36)->primary();
                $t->string('username')->unique();
                $t->string('password');
                $t->string('role', 40);
                $t->char('local_id', 36)->nullable();
                $t->char('trabajador_id', 36)->nullable();
                $t->string('pref_fuente', 20)->default('predeterminada');
                $t->string('pref_tamano', 10)->default('normal');
                $t->foreign('local_id')->references('id')->on('locales')->nullOnDelete();
            });
        }
        if (! Schema::hasTable('usuario_locales')) {
            Schema::create('usuario_locales', function (Blueprint $t) {
                $t->char('user_id', 36);
                $t->char('local_id', 36);
                $t->primary(['user_id', 'local_id']);
                $t->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
                $t->foreign('local_id')->references('id')->on('locales')->cascadeOnDelete();
            });
        }
        if (! Schema::hasTable('configuracion')) {
            Schema::create('configuracion', function (Blueprint $t) {
                $t->string('clave', 50)->primary();
                $t->mediumText('valor');
            });
        }
    }

    public function down(): void
    {
        foreach (['configuracion', 'usuario_locales', 'users', 'locales', 'rol_permisos', 'roles'] as $tabla) {
            Schema::dropIfExists($tabla);
        }
    }
};
