<?php

declare(strict_types=1);

namespace App\Modules\Trabajadores\Infrastructure\Http;

use App\Core\Http\ApiRequest;
use Illuminate\Validation\Rule;

final class EstadoRequest extends ApiRequest
{
    public function rules(): array
    {
        return ['estado' => ['required', Rule::in(['activo', 'pausado'])]];
    }

    public function messages(): array
    {
        return ['estado.*' => 'Estado inválido.'];
    }
}
