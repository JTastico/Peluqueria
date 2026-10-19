<?php

declare(strict_types=1);

namespace App\Core\Auth;

use App\Core\Contracts\ConsultaLocales;
use App\Core\Contracts\ConsultaRoles;
use App\Models\User;

/**
 * Arma el usuario autenticado con su rol, permisos, locales y preferencias.
 * El rol y los locales vienen de lecturas cacheadas; el usuario se lee siempre de la base,
 * así un usuario borrado o con otro rol surte efecto de inmediato.
 */
final class CargadorUsuario
{
    public function __construct(
        private readonly ConsultaRoles $roles,
        private readonly ConsultaLocales $locales,
    ) {}

    public function cargar(string $id): ?AuthUser
    {
        $u = User::query()->find($id);
        return $u ? $this->armar($u) : null;
    }

    public function armar(User $u): AuthUser
    {
        $rol = $this->roles->obtener($u->role);
        // Un rol inexistente no concede nada
        $alcance = $rol['alcance'] ?? 'local';

        return new AuthUser(
            id: $u->id,
            username: $u->username,
            role: $u->role,
            rolNombre: $rol['nombre'] ?? $u->role,
            alcance: $alcance,
            localId: $u->local_id,
            trabajadorId: $u->trabajador_id,
            permisos: $rol['permisos'] ?? [],
            locales: $this->localesDe($u, $alcance),
            preferencias: Preferencias::normalizar($u->pref_fuente, $u->pref_tamano),
        );
    }

    private function localesDe(User $u, string $alcance): array
    {
        if ($alcance === 'global') {
            return $this->locales->todos();
        }
        $ids = $alcance === 'multi'
            ? $u->localesAsignados()->pluck('locales.id')->all()
            : [];
        if ($u->local_id) {
            $ids[] = $u->local_id;
        }
        return $this->locales->porIds($ids);
    }
}
