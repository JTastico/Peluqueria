<?php

declare(strict_types=1);

namespace App\Core\Http;

use App\Core\Exceptions\ApiException;
use App\Core\Support\Alcance;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Base de todas las validaciones: autoriza siempre (los permisos ya los exige la ruta) y responde
 * el primer error como { message } con código 400, igual que el resto de la API.
 */
abstract class ApiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function failedValidation(Validator $validator): void
    {
        throw ApiException::invalido($validator->errors()->first());
    }

    public function alcance(): Alcance
    {
        return $this->attributes->get('alcance') ?? $this->user()->alcanceLocales();
    }
}
