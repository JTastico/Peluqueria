<?php

declare(strict_types=1);

namespace App\Modules\Configuracion\Infrastructure;

use App\Models\Configuracion;
use App\Modules\Configuracion\Domain\ConfiguracionRepository;

final class EloquentConfiguracionRepository implements ConfiguracionRepository
{
    public function todas(): array
    {
        return Configuracion::query()->where('clave', '!=', 'logo_datos')->pluck('valor', 'clave')->all();
    }

    public function logoDatos(): ?string
    {
        $datos = Configuracion::query()->whereKey('logo_datos')->value('valor');
        return $datos === '' ? null : $datos;
    }

    public function guardar(array $pares): void
    {
        // Un único INSERT ... ON DUPLICATE KEY UPDATE para todas las claves
        Configuracion::query()->upsert(
            array_map(fn (string $k, string $v) => ['clave' => $k, 'valor' => $v], array_keys($pares), $pares),
            ['clave'], ['valor']
        );
    }
}
