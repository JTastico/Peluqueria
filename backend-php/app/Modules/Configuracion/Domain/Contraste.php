<?php

declare(strict_types=1);

namespace App\Modules\Configuracion\Domain;

/** Reglas de legibilidad de los colores del tema (WCAG). */
final class Contraste
{
    public const MINIMO_PRIMARIO = 4.5;   // los botones llevan texto blanco sobre el color primario
    public const MINIMO_SECUNDARIO = 1.8;

    public static function conBlanco(string $hex): float
    {
        return 1.05 / (self::luminancia($hex) + 0.05);
    }

    private static function luminancia(string $hex): float
    {
        [$r, $g, $b] = array_map(function (int $i) use ($hex) {
            $c = hexdec(substr($hex, $i, 2)) / 255;
            return $c <= 0.03928 ? $c / 12.92 : (($c + 0.055) / 1.055) ** 2.4;
        }, [1, 3, 5]);
        return 0.2126 * $r + 0.7152 * $g + 0.0722 * $b;
    }
}
