<?php

declare(strict_types=1);

namespace App\Modules\Auth\Infrastructure\Http;

use App\Core\Http\ApiRequest;

final class LoginRequest extends ApiRequest
{
    public function rules(): array
    {
        return ['username' => ['required', 'string', 'max:255'], 'password' => ['required', 'string', 'max:72']];
    }

    public function messages(): array
    {
        return ['*' => 'Nombre de usuario y contraseña son requeridos.'];
    }
}
