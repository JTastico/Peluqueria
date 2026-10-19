<?php

declare(strict_types=1);

namespace App\Modules\Configuracion\Infrastructure;

use App\Core\Http\ApiRequest;

final class ConfiguracionRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'nombre_negocio' => ['sometimes', 'nullable', 'string', 'max:255'],
            'email' => ['sometimes', 'nullable', 'string', 'max:255'],
            'telefono' => ['sometimes', 'nullable', 'string', 'max:255'],
            'direccion' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return ['*.max' => 'Uno de los datos es demasiado largo (máximo 255 caracteres).'];
    }

    /** @return array<string,string> */
    public function cambios(): array
    {
        return array_map(fn ($v) => trim((string) $v), $this->validated());
    }
}
