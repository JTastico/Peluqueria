<?php

declare(strict_types=1);

namespace App\Modules\Ventas\Domain;

/** Cómo se reparte el precio de un servicio entre el trabajador y el local. */
final class Reparto
{
    private function __construct(public readonly float $trabajador, public readonly float $local) {}

    public static function calcular(float $precio, float $porcentajeTrabajador): self
    {
        $trabajador = round($precio * $porcentajeTrabajador) / 100;
        return new self($trabajador, round($precio - $trabajador, 2));
    }
}
