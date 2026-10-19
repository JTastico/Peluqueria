<?php

declare(strict_types=1);

namespace App\Modules\Auth\Domain;

use App\Models\User;

/** Puerto de persistencia de las cuentas, para iniciar sesión y mantener la propia cuenta. */
interface UsuarioRepository
{
    public function porUsername(string $username): ?User;

    public function porId(string $id): ?User;

    public function cambiarPassword(User $usuario, string $nueva): void;

    public function guardarPreferencias(string $id, string $fuente, string $tamano): void;
}
