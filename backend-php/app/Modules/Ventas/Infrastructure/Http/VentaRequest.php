<?php

declare(strict_types=1);

namespace App\Modules\Ventas\Infrastructure\Http;

use App\Core\Http\ApiRequest;
use Illuminate\Validation\Rule;

final class VentaRequest extends ApiRequest
{
    public const METODOS = ['efectivo', 'yape', 'plin', 'tarjeta', 'transferencia'];

    public function rules(): array
    {
        return [
            'local_id' => ['required', 'uuid'],
            'metodo_pago' => ['nullable', Rule::in(self::METODOS)],
            'fecha' => ['nullable', 'date_format:Y-m-d', 'before_or_equal:today'],
            'items' => ['required', 'array', 'min:1', 'max:30'],
            'items.*.servicio_id' => ['required', 'uuid'],
            'items.*.trabajador_id' => ['required', 'uuid'],
            'items.*.precio' => ['required', 'numeric', 'gt:0', 'max:99999999'],
        ];
    }

    public function messages(): array
    {
        return [
            'local_id.*' => 'Elige el local.',
            'metodo_pago.*' => 'Método de pago inválido.',
            'fecha.date_format' => 'Fecha inválida.',
            'fecha.before_or_equal' => 'La fecha no puede ser futura.',
            'items.required' => 'Agrega al menos un servicio.',
            'items.min' => 'Agrega al menos un servicio.',
            'items.max' => 'Máximo 30 servicios por venta.',
            'items.*.servicio_id.*' => 'Servicio inválido.',
            'items.*.trabajador_id.*' => 'Elige quién hizo cada servicio.',
            'items.*.precio.*' => 'El precio de cada servicio debe ser mayor a 0.',
        ];
    }

    /** @return list<array{servicio_id:string,trabajador_id:string,precio:float}> */
    public function items(): array
    {
        return array_map(fn (array $i) => [
            'servicio_id' => $i['servicio_id'], 'trabajador_id' => $i['trabajador_id'], 'precio' => (float) $i['precio'],
        ], $this->validated('items'));
    }
}
