<?php

declare(strict_types=1);

namespace App\Modules\Configuracion\Application;

use App\Modules\Configuracion\Domain\ConfiguracionRepository;

final class GestionarConfiguracion
{
    public const CLAVES = ['nombre_negocio', 'email', 'telefono', 'direccion'];

    public function __construct(private readonly ConfiguracionRepository $config) {}

    public function obtener(): array
    {
        $todas = $this->config->todas();
        return array_combine(self::CLAVES, array_map(fn (string $c) => $todas[$c] ?? '', self::CLAVES));
    }

    /** @param array<string,string> $cambios solo claves conocidas */
    public function actualizar(array $cambios): array
    {
        $this->config->guardar(array_intersect_key($cambios, array_flip(self::CLAVES)));
        return $this->obtener();
    }
}
