<?php

namespace Tests\Feature;

use Tests\TestCase;

class RolesYUsuariosTest extends TestCase
{
    public function test_crea_un_rol_y_rechaza_permisos_inventados(): void
    {
        [, $h] = $this->usuario('dueno', 'admin');
        $this->postJson('/api/roles', ['nombre' => 'Cajera', 'alcance' => 'local', 'permisos' => ['ventas.registrar']], $h)
            ->assertCreated()->assertJsonPath('id', 'cajera');
        $this->postJson('/api/roles', ['nombre' => 'Hack', 'alcance' => 'local', 'permisos' => ['todo.permitido']], $h)->assertStatus(400);
    }

    public function test_los_roles_base_no_se_tocan(): void
    {
        [, $h] = $this->usuario('dueno', 'admin');
        $this->putJson('/api/roles/admin', ['nombre' => 'x', 'alcance' => 'global', 'permisos' => []], $h)->assertStatus(403);
        $this->deleteJson('/api/roles/encargado', [], $h)->assertStatus(403);
    }

    public function test_cambiar_el_rol_surte_efecto_de_inmediato(): void
    {
        $local = $this->local('A');
        [$u, $hEnc] = $this->usuario('enc', 'encargado', $local);
        [, $h] = $this->usuario('dueno', 'admin');
        $this->postJson('/api/roles', ['nombre' => 'Solo lectura', 'alcance' => 'local', 'permisos' => ['locales.ver']], $h)->assertCreated();

        $this->getJson('/api/servicios', $hEnc)->assertOk();
        $this->putJson("/api/usuarios/{$u->id}", ['rol' => 'solo_lectura'], $h)->assertOk();
        $this->getJson('/api/servicios', $hEnc)->assertStatus(403);   // ya no tiene servicios.ver
    }

    public function test_no_se_puede_quitar_el_rol_al_unico_administrador_ni_cambiar_el_propio(): void
    {
        [$admin, $h] = $this->usuario('dueno', 'admin');
        $this->putJson("/api/usuarios/{$admin->id}", ['rol' => 'encargado'], $h)->assertStatus(403);
    }

    public function test_cambiar_contrasena_exige_la_actual_y_una_nueva_distinta(): void
    {
        [, $h] = $this->usuario('dueno', 'admin');
        $this->postJson('/api/auth/cambiar-password', ['actual' => 'incorrecta', 'nueva' => 'otra-clave-123'], $h)->assertStatus(401);
        $this->postJson('/api/auth/cambiar-password', ['actual' => 'clave-segura-123', 'nueva' => 'corta'], $h)->assertStatus(400);
        $this->postJson('/api/auth/cambiar-password', ['actual' => 'clave-segura-123', 'nueva' => 'clave-segura-123'], $h)->assertStatus(400);
        $this->postJson('/api/auth/cambiar-password', ['actual' => 'clave-segura-123', 'nueva' => 'otra-clave-123'], $h)->assertOk();
        $this->postJson('/api/auth/login', ['username' => 'dueno', 'password' => 'otra-clave-123'])->assertOk();
    }
}
