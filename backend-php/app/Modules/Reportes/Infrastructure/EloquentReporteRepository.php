<?php

declare(strict_types=1);

namespace App\Modules\Reportes\Infrastructure;

use App\Models\Venta;
use App\Modules\Reportes\Domain\FiltrosReporte;
use App\Modules\Reportes\Domain\ReporteRepository;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

final class EloquentReporteRepository implements ReporteRepository
{
    private const NOMBRE_TRABAJADOR = "COALESCE(NULLIF(TRIM(CONCAT(w.nombre, ' ', w.apellido)), ''), i.trabajador_nombre)";

    public function liquidacion(FiltrosReporte $f): array
    {
        // Las cifras se agregan UNA vez por (trabajador, local) y se unen al historial de asignaciones
        $acumulado = $this->ventas($f)->join('venta_items as i', 'i.venta_id', '=', 'ventas.id')
            ->groupBy('i.trabajador_id', 'ventas.local_id')
            ->select('i.trabajador_id', 'ventas.local_id', DB::raw('SUM(i.precio) as total'),
                DB::raw('SUM(i.monto_trabajador) as comision'), DB::raw('SUM(i.monto_local) as parte_local'), DB::raw('COUNT(*) as servicios'));

        $consulta = DB::table('trabajador_locales as tl')
            ->join('trabajadores as w', 'w.id', '=', 'tl.trabajador_id')
            ->join('locales as l', 'l.id', '=', 'tl.local_id')
            ->leftJoinSub($acumulado->toBase(), 'm', fn ($j) => $j->on('m.trabajador_id', '=', 'tl.trabajador_id')->on('m.local_id', '=', 'tl.local_id'));

        return $f->alcance->aplicar($consulta, 'tl.local_id')
            ->select('w.id as trabajador_id', DB::raw("TRIM(CONCAT(w.nombre, ' ', w.apellido)) as trabajador"), 'tl.local_id',
                'l.nombre as local_nombre', 'tl.estado as asignacion', DB::raw('COALESCE(m.total, 0) as total'),
                DB::raw('COALESCE(m.comision, 0) as comision'), DB::raw('COALESCE(m.parte_local, 0) as parte_local'),
                DB::raw('COALESCE(m.servicios, 0) as servicios'))
            ->orderByDesc('total')->orderBy('w.nombre')
            ->get()->map(fn ($r) => [
                'trabajador_id' => $r->trabajador_id, 'trabajador' => $r->trabajador, 'local_id' => $r->local_id,
                'local_nombre' => $r->local_nombre, 'asignacion' => $r->asignacion, 'total' => (float) $r->total,
                'comision' => (float) $r->comision, 'parte_local' => (float) $r->parte_local, 'servicios' => (int) $r->servicios,
            ])->all();
    }

    public function resumenPorLocal(FiltrosReporte $f): array
    {
        // Solo se agregan los items de las ventas del filtro (no de toda la tabla)
        $porVenta = $this->ventas($f)->leftJoin('venta_items as i', 'i.venta_id', '=', 'ventas.id')
            ->groupBy('ventas.id', 'ventas.local_id', 'ventas.total')
            ->select('ventas.id', 'ventas.local_id', 'ventas.total', DB::raw('SUM(i.monto_trabajador) as mt'),
                DB::raw('SUM(i.monto_local) as ml'), DB::raw('COUNT(i.id) as n'));

        $consulta = DB::table('locales as l')->leftJoinSub($porVenta->toBase(), 'x', 'x.local_id', '=', 'l.id');

        return $f->alcance->aplicar($consulta, 'l.id')->groupBy('l.id', 'l.nombre')
            ->select('l.id as local_id', 'l.nombre as local', DB::raw('COALESCE(SUM(x.total), 0) as total'),
                DB::raw('COUNT(x.id) as atenciones'), DB::raw('COALESCE(SUM(x.n), 0) as servicios'),
                DB::raw('COALESCE(SUM(x.mt), 0) as trabajadores'), DB::raw('COALESCE(SUM(x.ml), 0) as local_neto'))
            ->orderByDesc('total')->get()
            ->map(fn ($r) => [
                'local_id' => $r->local_id, 'local' => $r->local, 'total' => (float) $r->total, 'atenciones' => (int) $r->atenciones,
                'servicios' => (int) $r->servicios, 'trabajadores' => (float) $r->trabajadores, 'local_neto' => (float) $r->local_neto,
            ])->all();
    }

    public function serieTemporal(FiltrosReporte $f, bool $porHora): array
    {
        $columnas = [DB::raw('DATE(ventas.fecha_hora) as fecha'), DB::raw('SUM(ventas.total) as total'), DB::raw('COUNT(*) as atenciones')];
        $grupo = [DB::raw('DATE(ventas.fecha_hora)')];
        if ($porHora) {
            array_splice($columnas, 1, 0, [DB::raw('HOUR(ventas.fecha_hora) as hora')]);
            $grupo[] = DB::raw('HOUR(ventas.fecha_hora)');
        }
        return $this->ventas($f)->groupBy($grupo)->select($columnas)->orderBy('fecha')->get()
            ->map(fn ($r) => ['fecha' => $r->fecha, 'hora' => isset($r->hora) ? (int) $r->hora : null,
                'total' => (float) $r->total, 'atenciones' => (int) $r->atenciones])->all();
    }

    public function porTrabajador(FiltrosReporte $f, int $limite): array
    {
        return $this->items($f)->join('locales as l', 'l.id', '=', 'ventas.local_id')
            ->groupBy('i.trabajador_id', 'i.trabajador_nombre', 'w.nombre', 'w.apellido', 'ventas.local_id', 'l.nombre')
            ->select('i.trabajador_id', DB::raw(self::NOMBRE_TRABAJADOR.' as trabajador'), 'l.nombre as local',
                DB::raw('SUM(i.precio) as total'), DB::raw('SUM(i.monto_trabajador) as comision'), DB::raw('COUNT(*) as servicios'))
            ->orderByDesc('total')->limit($limite)->get()
            ->map(fn ($r) => ['trabajador_id' => $r->trabajador_id, 'trabajador' => $r->trabajador, 'local' => $r->local,
                'total' => (float) $r->total, 'comision' => (float) $r->comision, 'servicios' => (int) $r->servicios])->all();
    }

    public function porServicio(FiltrosReporte $f): array
    {
        return $this->items($f)->groupBy('i.servicio_nombre')
            ->select('i.servicio_nombre as servicio', DB::raw('COUNT(*) as cantidad'), DB::raw('SUM(i.precio) as total'))
            ->orderByDesc('total')->get()
            ->map(fn ($r) => ['servicio' => $r->servicio, 'cantidad' => (int) $r->cantidad, 'total' => (float) $r->total])->all();
    }

    public function totalPorDiaYTrabajador(FiltrosReporte $f): array
    {
        return $this->items($f)
            ->groupBy(DB::raw('DATE(ventas.fecha_hora)'), 'i.trabajador_id', 'i.trabajador_nombre', 'w.nombre', 'w.apellido')
            ->select(DB::raw('DATE(ventas.fecha_hora) as fecha'), DB::raw(self::NOMBRE_TRABAJADOR.' as trabajador'), DB::raw('SUM(i.precio) as total'))
            ->orderByDesc('fecha')->orderByDesc('total')->get()
            ->map(fn ($r) => ['fecha' => $r->fecha, 'trabajador' => $r->trabajador, 'total' => (float) $r->total])->all();
    }

    public function totales(FiltrosReporte $f): array
    {
        $r = $this->ventas($f)->selectRaw('COALESCE(SUM(ventas.total), 0) as ingresos, COUNT(*) as atenciones')->first();
        return ['ingresos' => (float) $r->ingresos, 'atenciones' => (int) $r->atenciones];
    }

    /** Ventas activas del periodo, la franja horaria y los locales del filtro. */
    private function ventas(FiltrosReporte $f): Builder
    {
        $consulta = Venta::query()->activas()->entre($f->inicio(), $f->finExclusivo())
            ->when($f->horaDesde, fn (Builder $q) => $q->whereRaw('TIME(ventas.fecha_hora) >= ?', ["{$f->horaDesde}:00"]))
            ->when($f->horaHasta, fn (Builder $q) => $q->whereRaw('TIME(ventas.fecha_hora) <= ?', ["{$f->horaHasta}:59"]));
        return $f->alcance->aplicar($consulta, 'ventas.local_id');
    }

    /** Servicios cobrados (items) de esas ventas, con el trabajador actual si todavía existe. */
    private function items(FiltrosReporte $f): Builder
    {
        return $this->ventas($f)->join('venta_items as i', 'i.venta_id', '=', 'ventas.id')
            ->leftJoin('trabajadores as w', 'w.id', '=', 'i.trabajador_id');
    }
}
