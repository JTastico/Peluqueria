<?php

declare(strict_types=1);

namespace App\Modules\Trabajadores\Infrastructure;

use App\Core\Support\Alcance;
use App\Models\Trabajador;
use App\Models\TrabajadorLocal;
use App\Models\TrabajadorMovimiento;
use App\Modules\Trabajadores\Domain\TrabajadorRepository;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

final class EloquentTrabajadorRepository implements TrabajadorRepository
{
    public function listar(Alcance $alcance): array
    {
        $consulta = $this->fichas($alcance);
        return $alcance->aplicar($consulta, 'tl.local_id')
            ->orderBy('l.nombre')->orderBy('t.nombre')->orderBy('t.apellido')
            ->get()->map(fn ($r) => $this->aArray($r))->all();
    }

    public function ficha(string $id, string $localId): ?array
    {
        $fila = $this->fichas(Alcance::de([$localId]))
            ->where('t.id', $id)->where('tl.local_id', $localId)->first();
        return $fila ? $this->aArray($fila) : null;
    }

    public function buscar(string $id): ?array
    {
        $t = Trabajador::query()->find($id, ['id', 'nombre', 'apellido', 'local_id']);
        return $t ? ['id' => $t->id, 'nombre' => $t->nombre, 'apellido' => $t->apellido, 'local_id' => $t->local_id] : null;
    }

    public function crear(string $nombre, string $apellido, ?string $telefono, string $localId): string
    {
        return DB::transaction(function () use ($nombre, $apellido, $telefono, $localId) {
            $t = Trabajador::query()->create([
                'nombre' => $nombre, 'apellido' => $apellido, 'telefono' => $telefono,
                'fecha_ingreso' => now()->toDateString(), 'local_id' => $localId,
            ]);
            $this->abrirEn($t->id, $localId);
            return $t->id;
        });
    }

    public function eliminar(string $id): bool
    {
        // Las ventas ya registradas conservan el nombre del trabajador (su id queda en NULL)
        return Trabajador::query()->whereKey($id)->delete() > 0;
    }

    public function trasladar(string $id, string $origen, string $destino, string $motivo, string $usuario): void
    {
        DB::transaction(function () use ($id, $origen, $destino, $motivo, $usuario) {
            Trabajador::query()->whereKey($id)->lockForUpdate()->first();
            TrabajadorLocal::query()->where('trabajador_id', $id)->where('local_id', $origen)
                ->update(['estado' => 'pausado', 'actualizado' => now()]);
            $this->abrirEn($id, $destino);
            Trabajador::query()->whereKey($id)->update(['local_id' => $destino]);
            TrabajadorMovimiento::query()->create([
                'trabajador_id' => $id, 'local_origen' => $origen, 'local_destino' => $destino,
                'fecha' => now(), 'motivo' => $motivo, 'usuario' => $usuario,
            ]);
        });
    }

    public function agregarALocal(string $id, string $localId): void
    {
        $this->abrirEn($id, $localId);
    }

    public function cambiarEstado(string $id, string $localId, string $estado): bool
    {
        return TrabajadorLocal::query()->where('trabajador_id', $id)->where('local_id', $localId)
            ->update(['estado' => $estado, 'actualizado' => now()]) > 0;
    }

    public function historial(string $id, Alcance $alcance): ?array
    {
        $t = Trabajador::query()->find($id, ['id', 'nombre', 'apellido']);
        if (! $t) {
            return null;
        }
        $locales = $alcance->aplicar(
            DB::table('trabajador_locales as tl')
                ->join('locales as l', 'l.id', '=', 'tl.local_id')
                ->leftJoinSub($this->acumuladoPorLocal($id), 'a', 'a.local_id', '=', 'tl.local_id')
                ->where('tl.trabajador_id', $id)
                ->select('tl.local_id', 'l.nombre as local_nombre', 'tl.estado', 'tl.desde', 'tl.actualizado',
                    DB::raw('COALESCE(a.servicios, 0) as servicios'), DB::raw('COALESCE(a.generado, 0) as generado'),
                    DB::raw('COALESCE(a.comision, 0) as comision'), 'a.ultimo_servicio'),
            'tl.local_id'
        )->orderByDesc('tl.actualizado')->get();

        if ($locales->isEmpty()) {
            return null;
        }
        $movimientos = DB::table('trabajador_movimientos as m')
            ->leftJoin('locales as lo', 'lo.id', '=', 'm.local_origen')
            ->leftJoin('locales as ld', 'ld.id', '=', 'm.local_destino')
            ->where('m.trabajador_id', $id)->orderByDesc('m.fecha')->limit(50)
            ->get(['m.fecha', 'lo.nombre as origen', 'ld.nombre as destino', 'm.motivo', 'm.usuario']);

        return [
            'trabajador' => ['id' => $t->id, 'nombre' => $t->nombreCompleto()],
            'locales' => $locales->map(fn ($l) => [
                'local_id' => $l->local_id, 'local_nombre' => $l->local_nombre, 'estado' => $l->estado,
                'desde' => Carbon::parse($l->desde)->format('Y-m-d'),
                'actualizado' => Carbon::parse($l->actualizado)->format('Y-m-d H:i'),
                'servicios' => (int) $l->servicios, 'generado' => (float) $l->generado, 'comision' => (float) $l->comision,
                'ultimo_servicio' => $l->ultimo_servicio ? Carbon::parse($l->ultimo_servicio)->format('Y-m-d H:i') : null,
            ])->all(),
            'movimientos' => $movimientos->map(fn ($m) => [
                'fecha' => Carbon::parse($m->fecha)->format('Y-m-d H:i'), 'origen' => $m->origen, 'destino' => $m->destino,
                'motivo' => $m->motivo, 'usuario' => $m->usuario,
            ])->all(),
        ];
    }

    public function activosEnLocal(array $ids, string $localId): array
    {
        return Trabajador::query()
            ->join('trabajador_locales as tl', 'tl.trabajador_id', '=', 'trabajadores.id')
            ->whereIn('trabajadores.id', $ids)->where('tl.local_id', $localId)->where('tl.estado', 'activo')
            ->get(['trabajadores.id', 'trabajadores.nombre', 'trabajadores.apellido'])
            ->mapWithKeys(fn (Trabajador $t) => [$t->id => $t->nombreCompleto()])->all();
    }

    /** Abre el historial del trabajador en un local, o lo reanuda si ya existía. */
    private function abrirEn(string $trabajadorId, string $localId): void
    {
        $ahora = now();
        TrabajadorLocal::query()->upsert(
            [['trabajador_id' => $trabajadorId, 'local_id' => $localId, 'estado' => 'activo', 'desde' => $ahora, 'actualizado' => $ahora]],
            ['trabajador_id', 'local_id'],
            ['estado', 'actualizado']
        );
    }

    /**
     * Fichas: una sola consulta con las cifras del mes agregadas en un JOIN (en vez de tres
     * subconsultas correlacionadas por cada fila).
     */
    private function fichas(Alcance $alcance): Builder
    {
        $mes = $alcance->aplicar(
            DB::table('venta_items as i')->join('ventas as v', 'v.id', '=', 'i.venta_id')
                ->where('v.estado', 'activa')->where('v.fecha_hora', '>=', now()->startOfMonth())
                ->groupBy('i.trabajador_id', 'v.local_id')
                ->select('i.trabajador_id', 'v.local_id', DB::raw('COUNT(*) as servicios_mes'),
                    DB::raw('SUM(i.precio) as generado_mes'), DB::raw('SUM(i.monto_trabajador) as comision_mes')),
            'v.local_id'
        );

        return TrabajadorLocal::query()->from('trabajador_locales as tl')
            ->join('trabajadores as t', 't.id', '=', 'tl.trabajador_id')
            ->join('locales as l', 'l.id', '=', 'tl.local_id')
            ->join('locales as la', 'la.id', '=', 't.local_id')
            ->leftJoinSub($mes, 'm', fn ($j) => $j->on('m.trabajador_id', '=', 'tl.trabajador_id')->on('m.local_id', '=', 'tl.local_id'))
            ->select('t.id', 't.nombre', 't.apellido', 't.telefono', 'tl.local_id', 'l.nombre as local_nombre',
                'tl.estado as asignacion_estado', 't.local_id as local_actual_id', 'la.nombre as local_actual_nombre',
                DB::raw('COALESCE(m.servicios_mes, 0) as servicios_mes'),
                DB::raw('COALESCE(m.generado_mes, 0) as generado_mes'),
                DB::raw('COALESCE(m.comision_mes, 0) as comision_mes'));
    }

    private function acumuladoPorLocal(string $trabajadorId)
    {
        return DB::table('venta_items as i')->join('ventas as v', 'v.id', '=', 'i.venta_id')
            ->where('v.estado', 'activa')->where('i.trabajador_id', $trabajadorId)
            ->groupBy('v.local_id')
            ->select('v.local_id', DB::raw('COUNT(*) as servicios'), DB::raw('SUM(i.precio) as generado'),
                DB::raw('SUM(i.monto_trabajador) as comision'), DB::raw('MAX(v.fecha_hora) as ultimo_servicio'));
    }

    private function aArray(object $r): array
    {
        return [
            'id' => $r->id, 'nombre' => $r->nombre, 'apellido' => $r->apellido, 'telefono' => $r->telefono,
            'local_id' => $r->local_id, 'local_nombre' => $r->local_nombre, 'asignacion_estado' => $r->asignacion_estado,
            'local_actual_id' => $r->local_actual_id, 'local_actual_nombre' => $r->local_actual_nombre,
            'servicios_mes' => (int) $r->servicios_mes, 'generado_mes' => (float) $r->generado_mes,
            'comision_mes' => (float) $r->comision_mes,
        ];
    }
}
