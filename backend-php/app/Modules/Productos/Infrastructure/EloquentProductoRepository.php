<?php

declare(strict_types=1);

namespace App\Modules\Productos\Infrastructure;

use App\Core\Support\Alcance;
use App\Models\Producto;
use App\Modules\Productos\Domain\EstadoStock;
use App\Modules\Productos\Domain\ProductoRepository;

final class EloquentProductoRepository implements ProductoRepository
{
    public function listar(Alcance $alcance): array
    {
        return $alcance->aplicar(Producto::query(), 'productos.local_id')->orderBy('nombre')->get()
            ->map(fn (Producto $p) => $this->aArray($p))->all();
    }

    public function crear(string $localId, array $datos): array
    {
        return $this->aArray(Producto::query()->create($datos + ['local_id' => $localId])->refresh());
    }

    public function actualizar(string $id, array $datos): ?array
    {
        $producto = Producto::query()->find($id);
        $producto?->update($datos);
        return $producto ? $this->aArray($producto->refresh()) : null;
    }

    public function ajustarStock(string $id, int $delta): array|null|false
    {
        // UPDATE atómico: dos ajustes simultáneos no se pisan y el stock nunca queda negativo
        $filas = Producto::query()->whereKey($id)->whereRaw('stock + ? >= 0', [$delta])->increment('stock', $delta);
        if ($filas === 0) {
            return Producto::query()->whereKey($id)->exists() ? false : null;
        }
        return $this->aArray(Producto::query()->findOrFail($id));
    }

    public function eliminar(string $id): bool
    {
        return Producto::query()->whereKey($id)->delete() > 0;
    }

    private function aArray(Producto $p): array
    {
        return [
            'id' => $p->id, 'local_id' => $p->local_id, 'nombre' => $p->nombre, 'stock' => $p->stock,
            'stock_minimo' => $p->stock_minimo, 'precio' => $p->precio, 'estado' => EstadoStock::de($p->stock, $p->stock_minimo),
        ];
    }
}
