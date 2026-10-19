<?php

declare(strict_types=1);

namespace App\Core\Support;

final class Redondeo
{
    /** Dos decimales (importes). */
    public static function dinero(float|int|string $valor): float
    {
        return round((float) $valor, 2);
    }
}
