<?php

declare(strict_types=1);

namespace App\Modules\Reportes\Domain;

/** Puerto de consultas agregadas para los reportes (solo lectura). */
interface ReporteRepository
{
    /** Lo vendido por cada trabajador en cada local y lo que le toca a él y al local. */
    public function liquidacion(FiltrosReporte $f): array;

    /** Por local: total, atenciones, servicios y reparto. Incluye locales sin ventas. */
    public function resumenPorLocal(FiltrosReporte $f): array;

    /** Ventas agrupadas por fecha (y hora si $porHora): [{fecha, hora?, total, atenciones}]. */
    public function serieTemporal(FiltrosReporte $f, bool $porHora): array;

    public function porTrabajador(FiltrosReporte $f, int $limite): array;

    /** Todos los servicios vendidos con su cantidad y total, de mayor a menor total. */
    public function porServicio(FiltrosReporte $f): array;

    /** Total vendido por trabajador y día: [{fecha, trabajador, total}] ordenado por fecha desc y total desc. */
    public function totalPorDiaYTrabajador(FiltrosReporte $f): array;

    /** @return array{ingresos:float,atenciones:int} */
    public function totales(FiltrosReporte $f): array;
}
