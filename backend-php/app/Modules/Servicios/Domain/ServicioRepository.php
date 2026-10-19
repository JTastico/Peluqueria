<?php

declare(strict_types=1);

namespace App\Modules\Servicios\Domain;

use App\Core\Support\Alcance;

/** Puerto de persistencia de servicios (precio y porcentaje del trabajador, por local). */
interface ServicioRepository
{
    public function listar(Alcance $alcance): array;

    /** Servicios por id (para validar y calcular ventas). @param list<string> $ids @return array<string,array> por id */
    public function porIds(array $ids): array;

    /** Crea el mismo servicio en varios locales. @param list<string> $localesIds @return list<array> */
    public function crearEnLocales(string $nombre, float $precio, float $porcentaje, array $localesIds): array;

    public function actualizar(string $id, string $nombre, float $precio, float $porcentaje): ?array;

    public function eliminar(string $id): bool;
}
