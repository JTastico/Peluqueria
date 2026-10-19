<?php

declare(strict_types=1);

namespace App\Modules\Productos\Application;

use App\Core\Exceptions\ApiException;
use App\Core\Support\Alcance;
use App\Modules\Locales\Domain\LocalRepository;
use App\Modules\Productos\Domain\ProductoRepository;

final class GestionarProductos
{
    public function __construct(private readonly ProductoRepository $productos, private readonly LocalRepository $locales) {}

    public function listar(Alcance $alcance): array
    {
        return $this->productos->listar($alcance);
    }

    public function crear(string $localId, array $datos): array
    {
        if (! $this->locales->existe($localId)) {
            throw ApiException::invalido('El local no existe.');
        }
        return $this->productos->crear($localId, $datos);
    }

    public function actualizar(string $id, array $datos): array
    {
        return $this->productos->actualizar($id, $datos) ?? throw ApiException::noEncontrado('Producto no encontrado.');
    }

    public function ajustarStock(string $id, int $delta): array
    {
        $resultado = $this->productos->ajustarStock($id, $delta);
        return match (true) {
            $resultado === null => throw ApiException::noEncontrado('Producto no encontrado.'),
            $resultado === false => throw ApiException::conflicto('El stock no puede quedar negativo.'),
            default => $resultado,
        };
    }

    public function eliminar(string $id): void
    {
        if (! $this->productos->eliminar($id)) {
            throw ApiException::noEncontrado('Producto no encontrado.');
        }
    }
}
