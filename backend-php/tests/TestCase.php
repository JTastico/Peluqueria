<?php

namespace Tests;

use App\Models\Local;
use App\Models\Servicio;
use App\Models\Trabajador;
use App\Models\TrabajadorLocal;
use App\Models\User;
use Database\Seeders\ConfiguracionSeeder;
use Database\Seeders\RolesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([RolesSeeder::class, ConfiguracionSeeder::class]);
    }

    protected function usuario(string $username, string $rol, ?Local $local = null): array
    {
        $u = User::query()->create(['username' => $username, 'password' => 'clave-segura-123', 'role' => $rol, 'local_id' => $local?->id]);
        $token = $this->postJson('/api/auth/login', ['username' => $username, 'password' => 'clave-segura-123'])->json('token');
        return [$u, ['Authorization' => "Bearer {$token}"]];
    }

    protected function local(string $nombre): Local
    {
        return Local::query()->create(['nombre' => $nombre, 'type' => 'barberia', 'estado' => 'Activo']);
    }

    /** Servicio de un local con un trabajador activo en él. @return array{Servicio,Trabajador} */
    protected function servicioConTrabajador(Local $local, float $precio = 100, float $porcentaje = 40): array
    {
        $s = Servicio::query()->create(['nombre' => 'Corte', 'precio' => $precio, 'porcentaje_trabajador' => $porcentaje, 'local_id' => $local->id]);
        $t = Trabajador::query()->create(['nombre' => 'Ana', 'apellido' => 'Paz', 'local_id' => $local->id]);
        TrabajadorLocal::query()->insert(['trabajador_id' => $t->id, 'local_id' => $local->id, 'estado' => 'activo', 'desde' => now(), 'actualizado' => now()]);
        return [$s, $t];
    }
}
