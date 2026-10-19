<?php

declare(strict_types=1);

namespace App\Modules\Ventas\Domain;

use App\Core\Alcance;
use Illuminate\Support\Carbon;

/** Puerto de persistencia de ventas (cabecera + servicios cobrados). */
interface VentaRepository
{
    /** Las más recientes primero (máximo 300). Filtros opcionales: desde / hasta (YYYY-MM-DD, ambos incluidos). */
    public function listar(Alcance $alcance, ?string $desde, ?string $hasta): array;

    /** @param list<array<string,mixed>> $items */
    public function registrar(string $localId, Carbon $momento, string $metodo, string $registradoPor, array $items): array;

    /** true = anulada · false = ya estaba anulada · null = no existe */
    public function anular(string $id): ?bool;

    public function obtener(string $id): ?array;
}
