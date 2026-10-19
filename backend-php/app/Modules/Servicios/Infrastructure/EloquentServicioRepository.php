<?php

declare(strict_types=1);

namespace App\Modules\Servicios\Infrastructure;

use App\Core\Alcance;
use App\Models\Servicio;
use App\Modules\Servicios\Domain\ServicioRepository;
use Illuminate\Support\Facades\DB;

final class EloquentServicioRepository implements ServicioRepository
{
    public function listar(Alcance $alcance): array
    {
        return $alcance->aplicar(Servicio::query()->with('local:id,nombre'), 'servicios.local_id')
            ->orderBy('nombre')->get()
            ->sortBy(fn (Servicio $s) => mb_strtolower($s->local->nombre).'|'.mb_strtolower($s->nombre))
            ->map(fn (Servicio $s) => $this->aArray($s))->values()->all();
    }

    public function porIds(array $ids): array
    {
        return Servicio::query()->whereIn('id', $ids)->get()->mapWithKeys(fn (Servicio $s) => [$s->id => $this->aArray($s)])->all();
    }

    public function crearEnLocales(string $nombre, float $precio, float $porcentaje, array $localesIds): array
    {
        return DB::transaction(function () use ($nombre, $precio, $porcentaje, $localesIds) {
            $creados = array_map(fn (string $local) => Servicio::query()->create([
                'nombre' => $nombre, 'precio' => $precio, 'porcentaje_trabajador' => $porcentaje, 'local_id' => $local,
            ])->id, $localesIds);
            return array_values($this->porIds($creados));
        });
    }

    public function actualizar(string $id, string $nombre, float $precio, float $porcentaje): ?array
    {
        $servicio = Servicio::query()->find($id);
        if (! $servicio) {
            return null;
        }
        $servicio->update(['nombre' => $nombre, 'precio' => $precio, 'porcentaje_trabajador' => $porcentaje]);
        return $this->aArray($servicio->fresh());
    }

    public function eliminar(string $id): bool
    {
        return Servicio::query()->whereKey($id)->delete() > 0;
    }

    private function aArray(Servicio $s): array
    {
        return [
            'id' => $s->id, 'nombre' => $s->nombre, 'precio' => $s->precio, 'porcentaje_trabajador' => $s->porcentaje_trabajador,
            'local_id' => $s->local_id, 'local_nombre' => $s->relationLoaded('local') ? $s->local->nombre : $s->local()->value('nombre'),
        ];
    }
}
