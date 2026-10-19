<?php

declare(strict_types=1);

namespace App\Modules\Reportes\Infrastructure\Http;

use App\Modules\Reportes\Application\ObtenerDashboard;
use App\Modules\Reportes\Application\ObtenerDetalleLocal;
use App\Modules\Reportes\Domain\ReporteRepository;
use Illuminate\Http\JsonResponse;

final class ReportesController
{
    public function liquidacion(ReporteRequest $r, ReporteRepository $reportes): JsonResponse
    {
        return response()->json($reportes->liquidacion($r->filtros()));
    }

    public function dashboard(ReporteRequest $r, ObtenerDashboard $dashboard): JsonResponse
    {
        return response()->json($dashboard($r->filtros()));
    }

    public function local(DetalleLocalRequest $r, string $id, ObtenerDetalleLocal $detalle): JsonResponse
    {
        $v = $r->validated();
        return response()->json($detalle($id, $v['periodo'] ?? 'month', $v['fecha'] ?? now()->toDateString()));
    }
}
