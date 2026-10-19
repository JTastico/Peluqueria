<?php

declare(strict_types=1);

namespace App\Modules\Configuracion\Infrastructure;

use App\Modules\Configuracion\Domain\ConfiguracionRepository;
use Illuminate\Contracts\Cache\Repository as Cache;

/**
 * Decorador con caché: nombre del negocio, tema y datos de contacto se leen en cada carga de la
 * pantalla (incluido el login, que es público) y casi nunca cambian. Los bytes del logo no se cachean.
 */
final class CachedConfiguracionRepository implements ConfiguracionRepository
{
    private const CLAVE = 'configuracion.todas';
    private const TTL = 3600;

    public function __construct(private readonly ConfiguracionRepository $interno, private readonly Cache $cache) {}

    public function todas(): array
    {
        return $this->cache->remember(self::CLAVE, self::TTL, fn () => $this->interno->todas());
    }

    public function logoDatos(): ?string
    {
        return $this->interno->logoDatos();
    }

    public function guardar(array $pares): void
    {
        $this->interno->guardar($pares);
        $this->cache->forget(self::CLAVE);
    }
}
