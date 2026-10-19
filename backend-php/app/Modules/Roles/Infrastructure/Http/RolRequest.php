<?php

declare(strict_types=1);

namespace App\Modules\Roles\Infrastructure\Http;

use App\Core\Http\ApiRequest;
use App\Core\Permisos\Catalogo;
use Illuminate\Validation\Rule;

final class RolRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:80'],
            'descripcion' => ['nullable', 'string', 'max:255'],
            'alcance' => ['required', Rule::in(Catalogo::ALCANCES)],
            'permisos' => ['present', 'array'],
            'permisos.*' => ['string', Rule::in(Catalogo::ids())],
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.required' => 'El nombre del rol es obligatorio (máximo 80 caracteres).',
            'nombre.max' => 'El nombre del rol es obligatorio (máximo 80 caracteres).',
            'alcance.*' => 'El alcance del rol no es válido.',
            'permisos.*' => 'La lista de permisos no es válida.',
        ];
    }

    public function datos(): array
    {
        $v = $this->validated();
        return [
            'nombre' => trim($v['nombre']),
            'descripcion' => trim($v['descripcion'] ?? ''),
            'alcance' => $v['alcance'],
            'permisos' => array_values(array_unique($v['permisos'])),
        ];
    }
}
