<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Índices para las consultas reales: filtros por local y rango de fechas, joins de reportes,
 * historial de trabajadores y búsquedas por rol. Se crean solo si no existen (sirve también
 * para una base de datos anterior).
 */
return new class extends Migration
{
    /** tabla => [nombre del índice => columnas] */
    private const INDICES = [
        'ventas' => [
            'idx_ventas_local_fecha' => ['local_id', 'fecha_hora'],
            'idx_ventas_fecha' => ['fecha_hora'],
            'idx_ventas_estado_fecha' => ['estado', 'fecha_hora'],
        ],
        'venta_items' => [
            'idx_items_venta' => ['venta_id'],
            'idx_items_trabajador' => ['trabajador_id', 'venta_id'],
            'idx_items_servicio' => ['servicio_id'],
        ],
        'servicios' => ['idx_servicios_local' => ['local_id', 'nombre']],
        'productos' => ['idx_productos_local' => ['local_id', 'nombre']],
        'trabajadores' => ['idx_trabajadores_local' => ['local_id']],
        'trabajador_locales' => ['idx_tl_local_estado' => ['local_id', 'estado']],
        'trabajador_movimientos' => ['idx_mov_trabajador_fecha' => ['trabajador_id', 'fecha']],
        'users' => ['idx_users_role' => ['role'], 'idx_users_local' => ['local_id']],
    ];

    public function up(): void
    {
        foreach (self::INDICES as $tabla => $indices) {
            foreach ($indices as $nombre => $columnas) {
                if (! Schema::hasIndex($tabla, $nombre)) {
                    Schema::table($tabla, fn (Blueprint $t) => $t->index($columnas, $nombre));
                }
            }
        }
    }

    public function down(): void
    {
        foreach (self::INDICES as $tabla => $indices) {
            foreach (array_keys($indices) as $nombre) {
                if (Schema::hasIndex($tabla, $nombre)) {
                    Schema::table($tabla, fn (Blueprint $t) => $t->dropIndex($nombre));
                }
            }
        }
    }
};
