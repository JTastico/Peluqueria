<?php

declare(strict_types=1);

namespace App\Modules\Reportes\Infrastructure;

use App\Core\Http\ApiRequest;
use Illuminate\Validation\Rule;

final class DetalleLocalRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'periodo' => ['nullable', Rule::in(['day', 'week', 'month', 'year'])],
            'fecha' => ['nullable', 'date_format:Y-m-d'],
        ];
    }

    public function messages(): array
    {
        return ['periodo.*' => 'Periodo inválido.', 'fecha.*' => 'Fecha inválida (use YYYY-MM-DD).'];
    }
}
