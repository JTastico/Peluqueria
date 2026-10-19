<?php

declare(strict_types=1);

namespace App\Modules\Productos\Infrastructure\Http;

use App\Core\Http\ApiRequest;

final class ProductoRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'local_id' => [$this->isMethod('POST') ? 'required' : 'sometimes', 'uuid'],
            'nombre' => ['required', 'string', 'max:255'],
            'stock' => ['required', 'integer', 'min:0', 'max:100000000'],
            'stock_minimo' => ['required', 'integer', 'min:0', 'max:100000000'],
            'precio' => ['required', 'numeric', 'min:0', 'max:99999999'],
        ];
    }

    public function messages(): array
    {
        return [
            'local_id.*' => 'El local es obligatorio.',
            'nombre.*' => 'El nombre del producto es obligatorio.',
            'stock.*' => 'El stock debe ser un entero mayor o igual a 0.',
            'stock_minimo.*' => 'El stock mínimo debe ser un entero mayor o igual a 0.',
            'precio.*' => 'El precio no es válido.',
        ];
    }

    public function datos(): array
    {
        $v = $this->validated();
        return ['nombre' => trim($v['nombre']), 'stock' => (int) $v['stock'], 'stock_minimo' => (int) $v['stock_minimo'],
            'precio' => round((float) $v['precio'], 2)];
    }
}
