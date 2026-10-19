<?php

declare(strict_types=1);

namespace App\Modules\Auth\Infrastructure;

use App\Models\User;
use App\Modules\Auth\Domain\UsuarioRepository;

final class EloquentUsuarioRepository implements UsuarioRepository
{
    public function porUsername(string $username): ?User
    {
        return User::query()->where('username', $username)->first();
    }

    public function porId(string $id): ?User
    {
        return User::query()->find($id);
    }

    public function cambiarPassword(User $usuario, string $nueva): void
    {
        $usuario->update(['password' => $nueva]);   // el cast "hashed" la guarda con bcrypt
    }

    public function guardarPreferencias(string $id, string $fuente, string $tamano): void
    {
        User::query()->whereKey($id)->update(['pref_fuente' => $fuente, 'pref_tamano' => $tamano]);
    }
}
