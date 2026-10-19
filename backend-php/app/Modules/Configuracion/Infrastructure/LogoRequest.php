<?php

declare(strict_types=1);

namespace App\Modules\Configuracion\Infrastructure;

use App\Core\Http\ApiRequest;

final class LogoRequest extends ApiRequest
{
    public function rules(): array
    {
        // El logo viaja en base64: se acepta hasta ~700 KB de texto (512 KB de imagen)
        return ['mime' => ['required', 'string', 'max:20'], 'datos' => ['required', 'string', 'max:700000']];
    }

    public function messages(): array
    {
        return ['*' => 'El logo debe ser una imagen PNG, JPG o WebP (máximo 512 KB).'];
    }
}
