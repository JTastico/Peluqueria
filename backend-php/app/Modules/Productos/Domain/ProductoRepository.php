<?php

declare(strict_types=1);

namespace App\Modules\Productos\Domain;

use App\Core\Alcance;

/** Puerto de persistencia del inventario por local. */
interface ProductoRepository
{
    public function listar(Alcance $alcance): array;

    public function crear(string $localId, array $datos): array;

    public function actualizar(string $id, array $datos): ?array;

    /** Suma o resta stock de forma atómica. @return array|null|false null = no existe, false = quedaría negativo */
    public function ajustarStock(string $id, int $delta): array|null|false;

    public function eliminar(string $id): bool;
}
