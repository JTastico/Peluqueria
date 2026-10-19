<?php

declare(strict_types=1);

namespace App\Modules\Ventas\Infrastructure\Http;

use App\Modules\Ventas\Application\ConsultarVentas;
use App\Modules\Ventas\Application\RegistrarVenta;
use Illuminate\Http\JsonResponse;

final class VentasController
{
    public function index(ListarVentasRequest $r, ConsultarVentas $ventas): JsonResponse
    {
        $v = $r->validated();
        return response()->json($ventas->listar($r->alcance(), $v['fecha'] ?? null, $v['desde'] ?? null, $v['hasta'] ?? null));
    }

    public function store(VentaRequest $r, RegistrarVenta $registrar): JsonResponse
    {
        $v = $r->validated();
        return response()->json($registrar($r->user(), $v['local_id'], $v['metodo_pago'] ?? 'efectivo', $r->items(), $v['fecha'] ?? null), 201);
    }

    public function anular(string $id, ConsultarVentas $ventas): JsonResponse
    {
        return response()->json($ventas->anular($id));
    }
}
