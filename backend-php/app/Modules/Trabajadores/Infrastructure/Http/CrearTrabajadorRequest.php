<?php

declare(strict_types=1);

namespace App\Modules\Trabajadores\Infrastructure\Http;

use App\Core\Http\ApiRequest;

final class CrearTrabajadorRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:255'],
            'apellido' => ['nullable', 'string', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:50'],
            'local_id' => ['required', 'uuid'],
        ];
    }

    public function messages(): array
    {
        return ['nombre.*' => 'El nombre del trabajador es obligatorio.', 'apellido.max' => 'El nombre del trabajador es obligatorio.',
            'telefono.max' => 'El nombre del trabajador es obligatorio.', 'local_id.*' => 'Elige el local.'];
    }
}
