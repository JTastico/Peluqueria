<?php

declare(strict_types=1);

namespace App\Modules\Usuarios\Infrastructure;

use App\Models\User;
use App\Modules\Usuarios\Domain\UsuarioAdminRepository;
use Illuminate\Support\Facades\DB;

final class EloquentUsuarioAdminRepository implements UsuarioAdminRepository
{
    public function listar(): array
    {
        // Relaciones cargadas por lotes (sin consultas por fila)
        return User::query()->with(['rol:id,nombre,alcance', 'local:id,nombre', 'trabajador:id,nombre,apellido', 'localesAsignados:id'])
            ->get()
            ->sortBy([
                fn (User $a, User $b) => $this->prioridad($a->role) <=> $this->prioridad($b->role),
                fn (User $a, User $b) => strcmp((string) $a->local?->nombre, (string) $b->local?->nombre),
                fn (User $a, User $b) => strcmp($a->username, $b->username),
            ])
            ->map(fn (User $u) => [
                'id' => $u->id, 'username' => $u->username, 'role' => $u->role,
                'rol_nombre' => $u->rol?->nombre ?? $u->role, 'alcance' => $u->rol?->alcance,
                'local_id' => $u->local_id, 'local_nombre' => $u->local?->nombre,
                'trabajador_id' => $u->trabajador_id, 'trabajador_nombre' => $u->trabajador?->nombreCompleto(),
                'locales_asignados' => $u->localesAsignados->pluck('id')->all(),
            ])->values()->all();
    }

    public function buscar(string $id): ?array
    {
        $u = User::query()->find($id, ['id', 'role']);
        return $u ? ['id' => $u->id, 'role' => $u->role] : null;
    }

    public function contarConRol(string $rolId): int
    {
        return User::query()->where('role', $rolId)->count();
    }

    public function asignarRol(string $id, string $rolId, array $localesIds): void
    {
        DB::transaction(function () use ($id, $rolId, $localesIds) {
            $usuario = User::query()->findOrFail($id);
            $usuario->update(['role' => $rolId]);
            $usuario->localesAsignados()->sync($localesIds);
        });
    }

    /** Administradores primero, luego encargados y el resto. */
    private function prioridad(string $rol): int
    {
        return match ($rol) { 'admin' => 0, 'encargado' => 1, default => 2 };
    }
}
