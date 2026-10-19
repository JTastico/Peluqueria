<?php

declare(strict_types=1);

namespace App\Modules\Productos\Domain;

final class EstadoStock
{
    /** Agotado: sin stock · Crítico: la mitad del mínimo o menos · Bajo: bajo el mínimo. */
    public static function de(int $stock, int $minimo): string
    {
        return match (true) {
            $stock <= 0 => 'Agotado',
            $stock <= $minimo / 2 => 'Crítico',
            $stock < $minimo => 'Bajo',
            default => 'Disponible',
        };
    }
}
