<?php

namespace Tests\Feature;

use Tests\TestCase;

class AutenticacionTest extends TestCase
{
    public function test_login_correcto_devuelve_token_y_usuario(): void
    {
        $this->usuario('dueno', 'admin');
        $r = $this->postJson('/api/auth/login', ['username' => 'dueno', 'password' => 'clave-segura-123']);
        $r->assertOk()->assertJsonPath('user.username', 'dueno')->assertJsonStructure(['token', 'user' => ['permisos', 'locales']]);
    }

    public function test_credenciales_incorrectas_no_revelan_si_el_usuario_existe(): void
    {
        $this->usuario('dueno', 'admin');
        $existe = $this->postJson('/api/auth/login', ['username' => 'dueno', 'password' => 'mala']);
        $noExiste = $this->postJson('/api/auth/login', ['username' => 'nadie', 'password' => 'mala']);
        $existe->assertStatus(401);
        $this->assertSame($existe->json('message'), $noExiste->json('message'));
    }

    public function test_sin_token_o_con_token_alterado_se_rechaza(): void
    {
        $this->getJson('/api/locales')->assertStatus(401);
        [, $h] = $this->usuario('dueno', 'admin');
        $this->getJson('/api/locales', ['Authorization' => $h['Authorization'].'x'])->assertStatus(401);
    }

    public function test_el_login_se_bloquea_tras_muchos_intentos(): void
    {
        for ($i = 0; $i < 8; $i++) {
            $this->postJson('/api/auth/login', ['username' => 'x', 'password' => 'y'])->assertStatus(401);
        }
        $this->postJson('/api/auth/login', ['username' => 'x', 'password' => 'y'])->assertStatus(429);
    }

    public function test_un_usuario_borrado_pierde_el_acceso_al_instante(): void
    {
        [$u, $h] = $this->usuario('dueno', 'admin');
        $this->getJson('/api/auth/me', $h)->assertOk();
        $u->delete();
        $this->getJson('/api/auth/me', $h)->assertStatus(401);
    }

    public function test_las_respuestas_llevan_cabeceras_de_seguridad(): void
    {
        $this->getJson('/api/marca')->assertHeader('X-Content-Type-Options', 'nosniff')->assertHeader('X-Frame-Options', 'DENY');
    }

    public function test_cuerpos_enormes_se_rechazan(): void
    {
        [, $h] = $this->usuario('dueno', 'admin');
        $this->postJson('/api/servicios', ['nombre' => str_repeat('a', 200000)], $h)->assertStatus(413);
    }
}
