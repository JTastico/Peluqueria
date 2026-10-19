<?php

declare(strict_types=1);

namespace App\Modules\Auth\Application;

use App\Core\Auth\AuthUser;
use App\Core\Exceptions\ApiException;
use App\Modules\Auth\Domain\UsuarioRepository;
use Illuminate\Contracts\Hashing\Hasher;

/** Lo que cada usuario puede hacer con su propia cuenta. */
final class GestionarCuenta
{
    public function __construct(private readonly UsuarioRepository $usuarios, private readonly Hasher $hasher) {}

    public function cambiarPassword(AuthUser $actual, string $contrasenaActual, string $nueva): void
    {
        if ($nueva === $contrasenaActual || $nueva === $actual->username) {
            throw ApiException::invalido('La nueva contraseña debe ser distinta a la actual y al usuario.');
        }
        $usuario = $this->usuarios->porId($actual->id);
        if (! $usuario || ! $this->hasher->check($contrasenaActual, $usuario->password)) {
            throw ApiException::noAutenticado('La contraseña actual no es correcta.');
        }
        $this->usuarios->cambiarPassword($usuario, $nueva);
    }

    public function guardarPreferencias(AuthUser $actual, string $fuente, string $tamano): array
    {
        $this->usuarios->guardarPreferencias($actual->id, $fuente, $tamano);
        return ['preferencias' => ['fuente' => $fuente, 'tamano' => $tamano]];
    }
}
