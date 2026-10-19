<?php

declare(strict_types=1);

namespace App\Modules\Locales\Application;

use App\Core\ApiException;
use App\Core\Alcance;
use App\Modules\Locales\Domain\LocalRepository;
use Illuminate\Contracts\Hashing\Hasher;

final class LocalesService
{
    public function __construct(private readonly LocalRepository $locales, private readonly Hasher $hasher) {}

    public function listar(Alcance $alcance): array
    {
        return $this->locales->resumenes($alcance);
    }

    public function obtener(string $id): array
    {
        return $this->locales->resumen($id) ?? throw ApiException::noEncontrado('Local no encontrado.');
    }

    /** @param array<string,mixed> $datos incluye "password" del encargado */
    public function crear(array $datos): array
    {
        $password = $datos['password'];
        unset($datos['password']);
        $username = $datos['username'];
        unset($datos['username']);

        $id = $this->locales->crearConEncargado($datos, $username, $this->hasher->make($password));
        return $this->locales->resumen($id);
    }

    public function eliminar(string $id): void
    {
        if (! $this->locales->eliminar($id)) {
            throw ApiException::noEncontrado('Local no encontrado para eliminar.');
        }
    }
}
