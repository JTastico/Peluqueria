<?php

declare(strict_types=1);

namespace App\Modules\Productos\Infrastructure;

use App\Modules\Productos\Application\ProductosService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ProductosController
{
    public function __construct(private readonly ProductosService $productos) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->productos->listar($request->attributes->get('alcance')));
    }

    public function store(ProductoRequest $r): JsonResponse
    {
        return response()->json($this->productos->crear($r->validated('local_id'), $r->datos()), 201);
    }

    public function update(ProductoRequest $r, string $id): JsonResponse
    {
        return response()->json($this->productos->actualizar($id, $r->datos()));
    }

    public function ajustarStock(AjusteStockRequest $r, string $id): JsonResponse
    {
        return response()->json($this->productos->ajustarStock($id, (int) $r->validated('delta')));
    }

    public function destroy(string $id): JsonResponse
    {
        $this->productos->eliminar($id);
        return response()->json(['message' => 'Producto eliminado.']);
    }
}
