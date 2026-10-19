<?php

declare(strict_types=1);

namespace App\Modules\Locales\Infrastructure;

use App\Core\Support\Alcance;
use App\Modules\Locales\Domain\LocalRepository;
use Illuminate\Contracts\Cache\Repository as Cache;

/**
 * Decorador con caché de la lista de locales (id, nombre, tipo): se consulta en cada petición para
 * calcular el alcance del usuario y solo cambia al crear o eliminar un local.
 */
final class CachedLocalRepository implements LocalRepository
{
    private const CLAVE = 'locales.todos';
    private const TTL = 3600;

    public function __construct(private readonly LocalRepository $interno, private readonly Cache $cache) {}

    public function todos(): array
    {
        return $this->cache->remember(self::CLAVE, self::TTL, fn () => $this->interno->todos());
    }

    public function porIds(array $ids): array
    {
        $buscados = array_flip($ids);
        return array_values(array_filter($this->todos(), fn (array $l) => isset($buscados[$l['id']])));
    }

    public function resumenes(Alcance $alcance): array { return $this->interno->resumenes($alcance); }
    public function resumen(string $id): ?array { return $this->interno->resumen($id); }
    public function existe(string $id): bool { return $this->interno->existe($id); }
    public function existenTodos(array $ids): bool { return $this->interno->existenTodos($ids); }

    public function crearConEncargado(array $local, string $username, string $passwordHash): string
    {
        $id = $this->interno->crearConEncargado($local, $username, $passwordHash);
        $this->cache->forget(self::CLAVE);
        return $id;
    }

    public function eliminar(string $id): bool
    {
        $eliminado = $this->interno->eliminar($id);
        $this->cache->forget(self::CLAVE);
        return $eliminado;
    }
}
