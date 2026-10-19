<?php

namespace Tests\Feature;

use App\Models\Local;
use Tests\TestCase;

class VentasTest extends TestCase
{
    private Local $local;

    protected function setUp(): void
    {
        parent::setUp();
        $this->local = $this->local('Centro');
    }

    public function test_registra_una_venta_con_su_reparto(): void
    {
        [$s, $t] = $this->servicioConTrabajador($this->local, 100, 40);
        [, $h] = $this->usuario('enc', 'encargado', $this->local);

        $r = $this->postJson('/api/ventas', [
            'metodo_pago' => 'yape',
            'items' => [['servicio_id' => $s->id, 'trabajador_id' => $t->id, 'precio' => 85.5]],
        ], $h);

        $r->assertCreated()->assertJsonPath('total', 85.5)->assertJsonPath('items.0.monto_trabajador', 34.2)
            ->assertJsonPath('items.0.monto_local', 51.3)->assertJsonPath('local_id', $this->local->id);
        $this->getJson('/api/ventas', $h)->assertOk()->assertJsonCount(1);
    }

    public function test_rechaza_servicios_o_trabajadores_de_otro_local(): void
    {
        $otro = $this->local('Otro');
        [$sOtro, $tOtro] = $this->servicioConTrabajador($otro);
        [$s, $t] = $this->servicioConTrabajador($this->local);
        [, $h] = $this->usuario('dueno', 'admin');

        $this->postJson('/api/ventas', ['local_id' => $this->local->id,
            'items' => [['servicio_id' => $sOtro->id, 'trabajador_id' => $t->id, 'precio' => 10]]], $h)->assertStatus(400);
        $this->postJson('/api/ventas', ['local_id' => $this->local->id,
            'items' => [['servicio_id' => $s->id, 'trabajador_id' => $tOtro->id, 'precio' => 10]]], $h)->assertStatus(400);
    }

    public function test_valida_precio_fecha_y_cantidad(): void
    {
        [$s, $t] = $this->servicioConTrabajador($this->local);
        [, $h] = $this->usuario('enc', 'encargado', $this->local);
        $item = ['servicio_id' => $s->id, 'trabajador_id' => $t->id, 'precio' => 10];

        $this->postJson('/api/ventas', ['items' => [['precio' => 0] + $item]], $h)->assertStatus(400);
        $this->postJson('/api/ventas', ['fecha' => '2099-01-01', 'items' => [$item]], $h)->assertStatus(400);
        $this->postJson('/api/ventas', ['items' => []], $h)->assertStatus(400);
        $this->postJson('/api/ventas', ['items' => array_fill(0, 31, $item)], $h)->assertStatus(400);
        $this->postJson('/api/ventas', ['metodo_pago' => 'bitcoin', 'items' => [$item]], $h)->assertStatus(400);
    }

    public function test_anular_dos_veces_da_conflicto(): void
    {
        [$s, $t] = $this->servicioConTrabajador($this->local);
        [, $h] = $this->usuario('enc', 'encargado', $this->local);
        $id = $this->postJson('/api/ventas', ['items' => [['servicio_id' => $s->id, 'trabajador_id' => $t->id, 'precio' => 10]]], $h)->json('id');

        $this->patchJson("/api/ventas/{$id}/anular", [], $h)->assertOk()->assertJsonPath('estado', 'anulada');
        $this->patchJson("/api/ventas/{$id}/anular", [], $h)->assertStatus(409);
    }

    public function test_la_encargada_no_anula_ventas_de_otro_local(): void
    {
        $otro = $this->local('Otro');
        [$s, $t] = $this->servicioConTrabajador($otro);
        [, $hDueno] = $this->usuario('dueno', 'admin');
        $id = $this->postJson('/api/ventas', ['local_id' => $otro->id, 'items' => [['servicio_id' => $s->id, 'trabajador_id' => $t->id, 'precio' => 10]]], $hDueno)->json('id');
        [, $hEnc] = $this->usuario('enc', 'encargado', $this->local);

        $this->patchJson("/api/ventas/{$id}/anular", [], $hEnc)->assertStatus(404);
    }
}
