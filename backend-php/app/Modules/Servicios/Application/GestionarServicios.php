<?php

declare(strict_types=1);

namespace App\Modules\Servicios\Application;

use App\Core\Auth\AuthUser;
use App\Core\Exceptions\ApiException;
use App\Core\Support\Alcance;
use App\Modules\Locales\Domain\LocalRepository;
use App\Modules\Servicios\Domain\ServicioRepository;

final class GestionarServicios
{
    public function __construct(private readonly ServicioRepository $servicios, private readonly LocalRepository $locales) {}

    public function listar(Alcance $alcance): array
    {
        return $this->servicios->listar($alcance);
    }

    /** Crea el servicio en uno o varios locales a la vez. @param list<string> $localesIds */
    public function crear(AuthUser $usuario, string $nombre, float $precio, float $porcentaje, array $localesIds): array
    {
        $localesIds = array_values(array_unique($localesIds));
        foreach ($localesIds as $local) {
            if (! $usuario->puedeVerLocal($local)) {
                throw ApiException::prohibido('No tienes acceso a ese local.');
            }
        }
        if (! $this->locales->existenTodos($localesIds)) {
            throw ApiException::invalido('Algún local indicado no existe.');
        }
        return $this->servicios->crearEnLocales($nombre, $precio, $porcentaje, $localesIds);
    }

    /** Las ventas ya registradas conservan el reparto con el que se hicieron. */
    public function actualizar(string $id, string $nombre, float $precio, float $porcentaje): array
    {
        return $this->servicios->actualizar($id, $nombre, $precio, $porcentaje)
            ?? throw ApiException::noEncontrado('Servicio no encontrado.');
    }

    public function eliminar(string $id): void
    {
        if (! $this->servicios->eliminar($id)) {
            throw ApiException::noEncontrado('Servicio no encontrado para eliminar.');
        }
    }
}
