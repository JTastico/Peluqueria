<?php

declare(strict_types=1);

namespace App\Modules\Reportes\Infrastructure;

use App\Core\Http\ApiRequest;
use App\Modules\Reportes\Domain\FiltrosReporte;

final class ReporteRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'desde' => ['nullable', 'date_format:Y-m-d'],
            'hasta' => ['nullable', 'date_format:Y-m-d'],
            'hora_desde' => ['nullable', 'date_format:H:i'],
            'hora_hasta' => ['nullable', 'date_format:H:i'],
        ];
    }

    public function messages(): array
    {
        return ['desde.*' => 'Fechas inválidas (use YYYY-MM-DD).', 'hasta.*' => 'Fechas inválidas (use YYYY-MM-DD).',
            'hora_desde.*' => 'Horas inválidas (use HH:MM).', 'hora_hasta.*' => 'Horas inválidas (use HH:MM).'];
    }

    public function filtros(): FiltrosReporte
    {
        $v = $this->validated();
        return FiltrosReporte::crear($v['desde'] ?? null, $v['hasta'] ?? null, $v['hora_desde'] ?? null, $v['hora_hasta'] ?? null, $this->alcance());
    }
}
