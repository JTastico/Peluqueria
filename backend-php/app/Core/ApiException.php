<?php

declare(strict_types=1);

namespace App\Core;

use RuntimeException;

/** Error de negocio con su código HTTP. Se muestra al usuario como { message }. */
final class ApiException extends RuntimeException
{
    private function __construct(string $message, public readonly int $status)
    {
        parent::__construct($message);
    }

    public static function invalido(string $mensaje): self { return new self($mensaje, 400); }
    public static function noAutenticado(string $mensaje = 'Sesión no iniciada.'): self { return new self($mensaje, 401); }
    public static function prohibido(string $mensaje = 'No tienes permiso para esta acción.'): self { return new self($mensaje, 403); }
    public static function noEncontrado(string $mensaje = 'Registro no encontrado.'): self { return new self($mensaje, 404); }
    public static function conflicto(string $mensaje): self { return new self($mensaje, 409); }
}
