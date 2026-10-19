<?php

declare(strict_types=1);

namespace App\Modules\Ventas\Infrastructure\Http;

use App\Core\Http\ApiRequest;

final class ListarVentasRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'fecha' => ['nullable', 'date_format:Y-m-d'],
            'desde' => ['nullable', 'date_format:Y-m-d'],
            'hasta' => ['nullable', 'date_format:Y-m-d'],
        ];
    }

    public function messages(): array
    {
        return ['*' => 'Fecha inválida.'];
    }
}
