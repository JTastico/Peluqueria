<?php

declare(strict_types=1);

namespace App\Modules\Locales\Infrastructure;

use App\Core\Alcance;
use App\Models\Local;
use App\Models\User;
use App\Modules\Locales\Domain\LocalRepository;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

final class EloquentLocalRepository implements LocalRepository
{
    public function todos(): array
    {
        return Local::query()->orderBy('nombre')->get(['id', 'nombre', 'type'])->toArray();
    }

    public function porIds(array $ids): array
    {
        return $ids === [] ? [] : Local::query()->whereIn('id', $ids)->orderBy('nombre')->get(['id', 'nombre', 'type'])->toArray();
    }

    public function resumenes(Alcance $alcance): array
    {
        return $this->conCifras()->tap(fn (Builder $q) => $alcance->aplicar($q, 'locales.id'))
            ->get()->map(fn (Local $l) => $this->aArray($l))->all();
    }

    public function resumen(string $id): ?array
    {
        $local = $this->conCifras()->find($id);
        return $local ? $this->aArray($local) : null;
    }

    public function existe(string $id): bool
    {
        return Local::query()->whereKey($id)->exists();
    }

    public function existenTodos(array $ids): bool
    {
        return Local::query()->whereIn('id', $ids)->count() === count(array_unique($ids));
    }

    public function crearConEncargado(array $local, string $username, string $passwordHash): string
    {
        return DB::transaction(function () use ($local, $username, $passwordHash) {
            $nuevo = Local::query()->create($local + ['username' => $username]);
            // El hash ya viene calculado: el cast "hashed" del modelo no lo vuelve a procesar
            User::query()->create([
                'username' => $username, 'password' => $passwordHash, 'role' => 'encargado', 'local_id' => $nuevo->id,
            ]);
            return $nuevo->id;
        });
    }

    public function eliminar(string $id): bool
    {
        // Las ventas, servicios, trabajadores e inventario del local caen por clave foránea (cascade)
        return DB::transaction(function () use ($id) {
            User::query()->where('local_id', $id)->delete();
            return Local::query()->whereKey($id)->delete() > 0;
        });
    }

    /** Cifras calculadas en vivo desde las ventas del mes en curso (una sola consulta con subconsultas). */
    private function conCifras(): Builder
    {
        $inicioMes = now()->startOfMonth()->toDateTimeString();
        $delMes = fn (Builder $q) => $q->where('estado', 'activa')->where('fecha_hora', '>=', $inicioMes);

        return Local::query()
            ->withCount(['asignaciones as peluqueros' => fn (Builder $q) => $q->where('estado', 'activo')])
            ->withSum(['ventas as ingresosMes' => $delMes], 'total')
            ->withCount(['ventas as clientesActivos' => $delMes])
            ->orderBy('nombre');
    }

    private function aArray(Local $l): array
    {
        return [
            'id' => $l->id, 'nombre' => $l->nombre, 'type' => $l->type ?: 'peluqueria', 'direccion' => $l->direccion,
            'telefono' => $l->telefono, 'horario' => $l->horario, 'imagen' => $l->imagen, 'estado' => $l->estado,
            'username' => $l->username,
            'peluqueros' => (int) $l->peluqueros,
            'ingresosMes' => (float) ($l->ingresosMes ?? 0),
            'clientesActivos' => (int) $l->clientesActivos,
        ];
    }
}
