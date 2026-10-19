<?php

declare(strict_types=1);

namespace App\Modules\Servicios\Infrastructure\Http;

use App\Core\Http\ApiRequest;

final class ServicioRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:255'],
            'precio' => ['required', 'numeric', 'gt:0', 'lt:100000000'],
            'porcentaje_trabajador' => ['required', 'numeric', 'between:0,100'],
            'local_id' => ['nullable', 'uuid'],
            'locales' => ['nullable', 'array', 'max:50'],
            'locales.*' => ['uuid'],
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.*' => 'El nombre del servicio es obligatorio.',
            'precio.*' => 'El precio debe ser un número mayor a 0 y menor a 100 millones.',
            'porcentaje_trabajador.*' => 'El porcentaje del trabajador debe estar entre 0 y 100.',
            'local_id.*' => 'Elige al menos un local.',
            'locales.*' => 'Elige al menos un local.',
        ];
    }

    public function nombre(): string { return trim($this->validated('nombre')); }
    public function precio(): float { return round((float) $this->validated('precio'), 2); }
    public function porcentaje(): float { return round((float) $this->validated('porcentaje_trabajador'), 2); }

    /** @return list<string> uno o varios locales (campo "locales" o "local_id") */
    public function locales(): array
    {
        $ids = $this->validated('locales') ?? array_filter([$this->validated('local_id')]);
        if ($ids === []) {
            throw \App\Core\Exceptions\ApiException::invalido('Elige al menos un local.');
        }
        return $ids;
    }
}
