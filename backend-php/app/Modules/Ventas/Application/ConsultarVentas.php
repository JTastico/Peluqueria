<?php

declare(strict_types=1);

namespace App\Modules\Ventas\Application;

use App\Core\Exceptions\ApiException;
use App\Core\Support\Alcance;
use App\Modules\Ventas\Domain\VentaRepository;

final class ConsultarVentas
{
    public function __construct(private readonly VentaRepository $ventas) {}

    public function listar(Alcance $alcance, ?string $fecha, ?string $desde, ?string $hasta): array
    {
        // "fecha" es un solo día: equivale a desde = hasta
        return $this->ventas->listar($alcance, $fecha ?: $desde, $fecha ?: $hasta);
    }

    public function anular(string $id): array
    {
        $resultado = $this->ventas->anular($id);
        if ($resultado === null) {
            throw ApiException::noEncontrado('Venta no encontrada.');
        }
        if ($resultado === false) {
            throw ApiException::conflicto('La venta ya estaba anulada.');
        }
        return $this->ventas->obtener($id);
    }
}
