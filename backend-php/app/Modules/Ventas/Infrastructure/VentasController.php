<?php

declare(strict_types=1);

namespace App\Modules\Ventas\Infrastructure;

use App\Modules\Ventas\Application\VentasService;
use Illuminate\Http\JsonResponse;

final class VentasController
{
    public function __construct(private readonly VentasService $ventas) {}

    public function index(ListarVentasRequest $r): JsonResponse
    {
        $v = $r->validated();
        return response()->json($this->ventas->listar($r->alcance(), $v['fecha'] ?? null, $v['desde'] ?? null, $v['hasta'] ?? null));
    }

    public function store(VentaRequest $r): JsonResponse
    {
        $v = $r->validated();
        return response()->json(
            $this->ventas->registrar($r->user(), $v['local_id'], $v['metodo_pago'] ?? 'efectivo', $r->items(), $v['fecha'] ?? null),
            201
        );
    }

    public function anular(string $id): JsonResponse
    {
        return response()->json($this->ventas->anular($id));
    }
}
