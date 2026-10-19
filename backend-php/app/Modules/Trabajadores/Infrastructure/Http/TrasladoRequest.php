<?php

declare(strict_types=1);

namespace App\Modules\Trabajadores\Infrastructure\Http;

use App\Core\Http\ApiRequest;

/** Sirve para trasladar (local_destino) y para agregar a otro local (local_id). */
final class TrasladoRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'local_destino' => ['required_without:local_id', 'uuid'],
            'local_id' => ['required_without:local_destino', 'uuid'],
            'motivo' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return ['local_destino.*' => 'Indica el local de destino.', 'local_id.*' => 'Elige el local.', 'motivo.max' => 'El motivo es demasiado largo.'];
    }
}
