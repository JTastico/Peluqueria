<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/** Crea el administrador inicial. Sin contraseñas por defecto conocidas. */
class AdministradorSeeder extends Seeder
{
    public function run(): void
    {
        if (User::query()->where('role', 'admin')->exists()) {
            return;
        }
        $fija = config('seguridad.admin_password');
        if ($fija && strlen($fija) < 12) {
            throw new \RuntimeException('ADMIN_PASSWORD debe tener al menos 12 caracteres.');
        }
        $password = $fija ?: Str::password(16, symbols: false);

        User::query()->create(['username' => config('seguridad.admin_usuario'), 'password' => $password, 'role' => 'admin']);

        $this->command->warn($fija
            ? 'Administrador creado con la contraseña de ADMIN_PASSWORD.'
            : "Administrador creado. Usuario: admin · Contraseña generada (cámbiala al ingresar): {$password}");
    }
}
