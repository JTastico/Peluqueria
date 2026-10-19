<?php

namespace Tests\Feature;

use Tests\TestCase;

class AlcancePorLocalTest extends TestCase
{
    public function test_la_encargada_solo_ve_su_local(): void
    {
        $a = $this->local('A');
        $b = $this->local('B');
        [, $h] = $this->usuario('enc', 'encargado', $a);

        $this->getJson('/api/locales', $h)->assertOk()->assertJsonCount(1)->assertJsonPath('0.id', $a->id);
        $this->getJson("/api/locales/{$b->id}", $h)->assertStatus(403);
        $this->getJson("/api/servicios?local_id={$b->id}", $h)->assertStatus(403);
    }

    public function test_el_dueno_ve_todos_los_locales(): void
    {
        $this->local('A');
        $this->local('B');
        [, $h] = $this->usuario('dueno', 'admin');
        $this->getJson('/api/locales', $h)->assertOk()->assertJsonCount(2);
    }

    public function test_sin_el_permiso_la_accion_se_rechaza(): void
    {
        $a = $this->local('A');
        [, $h] = $this->usuario('enc', 'encargado', $a);
        $this->getJson('/api/reportes/dashboard', $h)->assertStatus(403);
        $this->postJson('/api/locales', ['nombre' => 'X'], $h)->assertStatus(403);
        $this->getJson('/api/usuarios', $h)->assertStatus(403);
    }

    public function test_no_se_puede_tocar_un_registro_de_otro_local(): void
    {
        $a = $this->local('A');
        $b = $this->local('B');
        [$sB] = $this->servicioConTrabajador($b);
        [, $h] = $this->usuario('dueno2', 'admin');
        [, $hEnc] = $this->usuario('enc', 'encargado', $a);

        $this->deleteJson("/api/servicios/{$sB->id}", [], $hEnc)->assertStatus(403);   // sin permiso de administrar
        $this->getJson("/api/trabajadores", $hEnc)->assertOk()->assertJsonCount(0);
        $this->getJson("/api/trabajadores", $h)->assertOk()->assertJsonCount(1);
    }

    public function test_los_ids_invalidos_se_rechazan(): void
    {
        [, $h] = $this->usuario('dueno', 'admin');
        $this->getJson("/api/ventas?local_id=1'%20OR%201=1", $h)->assertStatus(400);
        $this->deleteJson('/api/servicios/xyz', [], $h)->assertStatus(404);
    }
}
