<?php

declare(strict_types=1);

namespace App\Modules\Ventas\Infrastructure;

use App\Core\Support\Alcance;
use App\Models\Venta;
use App\Models\VentaItem;
use App\Modules\Ventas\Domain\VentaRepository;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class EloquentVentaRepository implements VentaRepository
{
    public function listar(Alcance $alcance, ?string $desde, ?string $hasta): array
    {
        $consulta = Venta::query()->with(['items', 'local:id,nombre']);
        $alcance->aplicar($consulta, 'ventas.local_id');
        // Rangos sobre fecha_hora (sin DATE()) para aprovechar el índice (local_id, fecha_hora)
        $consulta->when($desde, fn (Builder $q) => $q->where('ventas.fecha_hora', '>=', "{$desde} 00:00:00"))
            ->when($hasta, fn (Builder $q) => $q->where('ventas.fecha_hora', '<', Carbon::parse($hasta)->addDay()->startOfDay()));

        return $consulta->orderByDesc('ventas.fecha_hora')->limit(300)->get()
            ->map(fn (Venta $v) => $this->aArray($v))->all();
    }

    public function registrar(string $localId, Carbon $momento, string $metodo, string $registradoPor, array $items): array
    {
        $venta = DB::transaction(function () use ($localId, $momento, $metodo, $registradoPor, $items) {
            $venta = Venta::query()->create([
                'local_id' => $localId, 'fecha_hora' => $momento, 'total' => round(array_sum(array_column($items, 'precio')), 2),
                'metodo_pago' => $metodo, 'estado' => 'activa', 'registrado_por' => $registradoPor, 'creado' => now(),
            ]);
            // Un solo INSERT para todos los servicios de la venta
            VentaItem::query()->insert(array_map(
                fn (array $i) => $i + ['id' => (string) Str::uuid7(), 'venta_id' => $venta->id], $items
            ));
            return $venta;
        });
        return $this->obtener($venta->id);
    }

    public function anular(string $id): ?bool
    {
        // UPDATE condicional: dos anulaciones simultáneas no se pisan
        if (Venta::query()->whereKey($id)->where('estado', 'activa')->update(['estado' => 'anulada']) > 0) {
            return true;
        }
        return Venta::query()->whereKey($id)->exists() ? false : null;
    }

    public function obtener(string $id): ?array
    {
        $venta = Venta::query()->with(['items', 'local:id,nombre'])->find($id);
        return $venta ? $this->aArray($venta) : null;
    }

    private function aArray(Venta $v): array
    {
        return [
            'id' => $v->id, 'local_id' => $v->local_id, 'local_nombre' => $v->local->nombre,
            'fecha_hora' => Carbon::parse($v->fecha_hora)->format('Y-m-d H:i:s'),
            'total' => $v->total, 'metodo_pago' => $v->metodo_pago, 'estado' => $v->estado,
            'registrado_por' => $v->registrado_por,
            'items' => $v->items->map(fn (VentaItem $i) => [
                'id' => $i->id, 'venta_id' => $i->venta_id, 'servicio_id' => $i->servicio_id,
                'servicio_nombre' => $i->servicio_nombre, 'trabajador_id' => $i->trabajador_id,
                'trabajador_nombre' => $i->trabajador_nombre, 'precio' => $i->precio,
                'porcentaje_trabajador' => $i->porcentaje_trabajador, 'monto_trabajador' => $i->monto_trabajador,
                'monto_local' => $i->monto_local,
            ])->all(),
        ];
    }
}
