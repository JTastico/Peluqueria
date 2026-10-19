<?php

declare(strict_types=1);

namespace App\Modules\Auth\Infrastructure\Http;

use App\Core\Auth\Preferencias;
use App\Core\Http\ApiRequest;
use Illuminate\Validation\Rule;

final class PreferenciasRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'fuente' => ['required', Rule::in(Preferencias::FUENTES)],
            'tamano' => ['required', Rule::in(Preferencias::TAMANOS)],
        ];
    }

    public function messages(): array
    {
        return ['*' => 'Preferencias inválidas.'];
    }
}
