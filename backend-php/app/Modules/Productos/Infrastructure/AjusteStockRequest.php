<?php

declare(strict_types=1);

namespace App\Modules\Productos\Infrastructure;

use App\Core\Http\ApiRequest;

final class AjusteStockRequest extends ApiRequest
{
    public function rules(): array
    {
        return ['delta' => ['required', 'integer', 'not_in:0', 'between:-100000,100000']];
    }

    public function messages(): array
    {
        return ['delta.*' => 'Ajuste de stock inválido.'];
    }
}
