<?php

declare(strict_types=1);

namespace App\Modules\Usuarios\Domain;

final class Preferencias
{
    public const FUENTES = ['predeterminada', 'clasica', 'redondeada', 'legible', 'monoespaciada'];
    public const TAMANOS = ['pequeno', 'normal', 'grande', 'extra'];

    public static function normalizar(?string $fuente, ?string $tamano): array
    {
        return [
            'fuente' => in_array($fuente, self::FUENTES, true) ? $fuente : 'predeterminada',
            'tamano' => in_array($tamano, self::TAMANOS, true) ? $tamano : 'normal',
        ];
    }
}
