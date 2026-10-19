<?php

namespace Tests\Unit;

use App\Core\ApiException;
use App\Core\Alcance;
use App\Modules\Configuracion\Domain\Contraste;
use App\Modules\Productos\Domain\EstadoStock;
use App\Modules\Reportes\Domain\FiltrosReporte;
use App\Modules\Roles\Domain\IdRol;
use App\Modules\Ventas\Domain\Reparto;
use PHPUnit\Framework\TestCase;

class ReglasDeDominioTest extends TestCase
{
    public function test_reparto_suma_el_precio_exacto(): void
    {
        foreach ([[100, 40], [85.5, 40], [33.33, 50], [19.99, 33.33], [10, 0], [10, 100]] as [$precio, $pct]) {
            $r = Reparto::calcular($precio, $pct);
            $this->assertEqualsWithDelta($precio, $r->trabajador + $r->local, 0.001, "precio {$precio} al {$pct}%");
        }
        $this->assertSame(34.2, Reparto::calcular(85.5, 40)->trabajador);
    }

    public function test_estado_de_stock(): void
    {
        $this->assertSame('Agotado', EstadoStock::de(0, 5));
        $this->assertSame('Crítico', EstadoStock::de(2, 5));
        $this->assertSame('Bajo', EstadoStock::de(4, 5));
        $this->assertSame('Disponible', EstadoStock::de(5, 5));
    }

    public function test_contraste_rechaza_colores_claros(): void
    {
        $this->assertLessThan(Contraste::MINIMO_PRIMARIO, Contraste::conBlanco('#ffff00'));
        $this->assertGreaterThan(Contraste::MINIMO_PRIMARIO, Contraste::conBlanco('#1d4ed8'));
    }

    public function test_id_de_rol(): void
    {
        $this->assertSame('encargada_de_turno', IdRol::desdeNombre('Encargada de Turno'));
        $this->assertSame('', IdRol::desdeNombre('***'));
    }

    public function test_alcance(): void
    {
        $this->assertTrue(Alcance::todos()->incluye('x'));
        $this->assertFalse(Alcance::de(['a'])->incluye('b'));
        $this->assertSame('a', Alcance::de(['a'])->unico());
        $this->assertNull(Alcance::de(['a', 'b'])->unico());
    }

    public function test_periodo_anterior_tiene_igual_duracion(): void
    {
        $f = new FiltrosReporte('2026-10-10', '2026-10-19', null, null, Alcance::todos());
        $a = $f->anterior();
        $this->assertSame(10, $f->dias());
        $this->assertSame('2026-09-30', $a->desde);
        $this->assertSame('2026-10-09', $a->hasta);
        $this->assertSame('2026-10-20 00:00:00', $f->finExclusivo());
    }

    public function test_rangos_invalidos_se_rechazan(): void
    {
        $this->expectException(ApiException::class);
        new FiltrosReporte('2026-10-19', '2026-10-10', null, null, Alcance::todos());
    }
}
