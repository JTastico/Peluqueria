<?php

declare(strict_types=1);

namespace App\Modules\Auth\Infrastructure\Http;

use App\Core\Http\ApiRequest;

final class CambiarPasswordRequest extends ApiRequest
{
    public function rules(): array
    {
        return ['actual' => ['required', 'string', 'max:72'], 'nueva' => ['required', 'string', 'min:8', 'max:72']];
    }

    public function messages(): array
    {
        return [
            'actual.*' => 'Contraseña actual y nueva son obligatorias.',
            'nueva.required' => 'Contraseña actual y nueva son obligatorias.',
            'nueva.*' => 'La nueva contraseña debe tener entre 8 y 72 caracteres.',
        ];
    }
}
