<?php

declare(strict_types=1);

namespace App\Modules\Configuracion\Infrastructure;

use App\Core\Http\ApiRequest;

final class TemaRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'primario' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'secundario' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'preset' => ['nullable', 'regex:/^[a-z0-9_]{1,20}$/'],
        ];
    }

    public function messages(): array
    {
        return ['primario.*' => 'Los colores deben tener formato #RRGGBB.', 'secundario.*' => 'Los colores deben tener formato #RRGGBB.'];
    }

    public function preset(): string
    {
        return $this->validated()['preset'] ?? 'personalizado';
    }
}
