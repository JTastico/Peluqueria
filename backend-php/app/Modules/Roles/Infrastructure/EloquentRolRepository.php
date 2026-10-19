<?php

declare(strict_types=1);

namespace App\Modules\Roles\Infrastructure;

use App\Models\Rol;
use App\Models\RolPermiso;
use App\Modules\Roles\Domain\RolRepository;
use Illuminate\Support\Facades\DB;

final class EloquentRolRepository implements RolRepository
{
    public function obtener(string $rolId): ?array
    {
        $rol = Rol::query()->with('permisos')->find($rolId);
        return $rol ? $this->aArray($rol) : null;
    }

    public function todos(): array
    {
        return Rol::query()->with('permisos')->withCount('usuarios')
            ->orderByDesc('es_sistema')->orderBy('nombre')->get()
            ->map(fn (Rol $r) => array_merge($this->aArray($r), ['usuarios' => (int) $r->usuarios_count]))
            // admin primero, luego los roles base y al final los creados
            ->sortBy(fn (array $r) => $r['id'] === 'admin' ? 0 : ($r['es_sistema'] ? 1 : 2))
            ->values()->all();
    }

    public function existe(string $id): bool
    {
        return Rol::query()->whereKey($id)->exists();
    }

    public function esDeSistema(string $id): bool
    {
        return (bool) Rol::query()->whereKey($id)->value('es_sistema');
    }

    public function contarUsuarios(string $id): int
    {
        return Rol::query()->whereKey($id)->withCount('usuarios')->first()?->usuarios_count ?? 0;
    }

    public function crear(string $id, array $datos): void
    {
        DB::transaction(function () use ($id, $datos) {
            Rol::query()->create(['id' => $id, 'nombre' => $datos['nombre'], 'descripcion' => $datos['descripcion'],
                'alcance' => $datos['alcance'], 'es_sistema' => false]);
            $this->guardarPermisos($id, $datos['permisos']);
        });
    }

    public function actualizar(string $id, array $datos): void
    {
        DB::transaction(function () use ($id, $datos) {
            Rol::query()->whereKey($id)->update(['nombre' => $datos['nombre'],
                'descripcion' => $datos['descripcion'], 'alcance' => $datos['alcance']]);
            RolPermiso::query()->where('rol_id', $id)->delete();
            $this->guardarPermisos($id, $datos['permisos']);
        });
    }

    public function eliminar(string $id): void
    {
        Rol::query()->whereKey($id)->delete();
    }

    private function guardarPermisos(string $id, array $permisos): void
    {
        RolPermiso::query()->insert(array_map(fn (string $p) => ['rol_id' => $id, 'permiso' => $p], $permisos));
    }

    private function aArray(Rol $r): array
    {
        return [
            'id' => $r->id, 'nombre' => $r->nombre, 'descripcion' => $r->descripcion, 'alcance' => $r->alcance,
            'es_sistema' => (bool) $r->es_sistema, 'usuarios' => 0,
            'permisos' => $r->permisos->pluck('permiso')->all(),
        ];
    }
}
