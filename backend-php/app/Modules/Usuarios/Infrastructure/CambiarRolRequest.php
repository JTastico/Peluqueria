<?php

declare(strict_types=1);

namespace App\Modules\Usuarios\Infrastructure;

use App\Core\Http\ApiRequest;

final class CambiarRolRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'rol' => ['required', 'string', 'regex:/^[a-z0-9_]{1,40}$/'],
            'locales' => ['nullable', 'array', 'max:100'],
            'locales.*' => ['uuid'],
        ];
    }

    public function messages(): array
    {
        return ['rol.*' => 'El rol indicado no existe.', 'locales.*' => 'Elige al menos un local para este rol.'];
    }
}
