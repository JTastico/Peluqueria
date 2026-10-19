<?php

declare(strict_types=1);

namespace App\Modules\Locales\Infrastructure;

use App\Core\Http\ApiRequest;
use Illuminate\Validation\Rule;

final class CrearLocalRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:255'],
            'type' => ['nullable', Rule::in(['barberia', 'peluqueria', 'spa'])],
            'direccion' => ['nullable', 'string', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:50'],
            'horario' => ['nullable', 'string', 'max:100'],
            'imagen' => ['nullable', 'url:http,https', 'max:255'],
            'estado' => ['nullable', Rule::in(['Activo', 'Inactivo'])],
            'username' => ['required', 'string', 'max:255', 'unique:users,username'],
            'password' => ['required', 'string', 'min:8', 'max:72'],
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.required' => 'Nombre, usuario y contraseña del local son obligatorios.',
            'username.required' => 'Nombre, usuario y contraseña del local son obligatorios.',
            'username.unique' => 'Ya existe un registro con esos datos (usuario o DNI repetido).',
            'password.*' => 'La contraseña del encargado debe tener entre 8 y 72 caracteres.',
            'type.in' => 'El tipo de local no es válido.',
            'imagen.url' => 'La imagen debe ser un enlace http(s).',
        ];
    }

    public function datos(): array
    {
        $v = $this->validated();
        return [
            'nombre' => trim($v['nombre']), 'type' => $v['type'] ?? 'peluqueria',
            'direccion' => $v['direccion'] ?? null, 'telefono' => $v['telefono'] ?? null, 'horario' => $v['horario'] ?? null,
            'imagen' => $v['imagen'] ?? null, 'estado' => $v['estado'] ?? 'Activo',
            'username' => trim($v['username']), 'password' => $v['password'],
        ];
    }
}
