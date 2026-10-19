<?php

declare(strict_types=1);

namespace App\Modules\Roles\Domain;

use Illuminate\Support\Str;

final class IdRol
{
    /** "Encargada de turno" -> "encargada_de_turno" (máx. 40 caracteres). */
    public static function desdeNombre(string $nombre): string
    {
        return trim(substr(Str::slug($nombre, '_'), 0, 40), '_');
    }
}
