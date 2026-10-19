<?php

declare(strict_types=1);

namespace App\Modules\Roles\Infrastructure;

use App\Modules\Roles\Domain\RolRepository;
use Illuminate\Contracts\Cache\Repository as Cache;

/**
 * Decorador con caché: el rol y sus permisos casi nunca cambian pero se leen en CADA petición
 * autenticada. Se invalida al escribir. El resto de métodos se delegan tal cual.
 */
final class CachedRolRepository implements RolRepository
{
    private const TTL = 3600;

    public function __construct(private readonly RolRepository $interno, private readonly Cache $cache) {}

    public function obtener(string $rolId): ?array
    {
        return $this->cache->remember("rol.{$rolId}", self::TTL, fn () => $this->interno->obtener($rolId));
    }

    public function todos(): array { return $this->interno->todos(); }
    public function existe(string $id): bool { return $this->interno->existe($id); }
    public function esDeSistema(string $id): bool { return $this->interno->esDeSistema($id); }
    public function contarUsuarios(string $id): int { return $this->interno->contarUsuarios($id); }

    public function crear(string $id, array $datos): void
    {
        $this->interno->crear($id, $datos);
        $this->cache->forget("rol.{$id}");
    }

    public function actualizar(string $id, array $datos): void
    {
        $this->interno->actualizar($id, $datos);
        $this->cache->forget("rol.{$id}");
    }

    public function eliminar(string $id): void
    {
        $this->interno->eliminar($id);
        $this->cache->forget("rol.{$id}");
    }
}
