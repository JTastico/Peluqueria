<?php

declare(strict_types=1);

namespace App\Modules\Reportes\Infrastructure;

use App\Modules\Reportes\Application\ReportesService;
use Illuminate\Http\JsonResponse;

final class ReportesController
{
    public function __construct(private readonly ReportesService $reportes) {}

    public function liquidacion(ReporteRequest $r): JsonResponse
    {
        return response()->json($this->reportes->liquidacion($r->filtros()));
    }

    public function dashboard(ReporteRequest $r): JsonResponse
    {
        return response()->json($this->reportes->dashboard($r->filtros()));
    }

    public function local(DetalleLocalRequest $r, string $id): JsonResponse
    {
        return response()->json($this->reportes->detalleLocal($id, $r->validated('periodo') ?? 'month', $r->validated('fecha') ?? now()->toDateString()));
    }
}
