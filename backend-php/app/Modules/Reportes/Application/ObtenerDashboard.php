<?php

declare(strict_types=1);

namespace App\Modules\Reportes\Application;

use App\Modules\Reportes\Domain\FiltrosReporte;
use App\Modules\Reportes\Domain\ReporteRepository;
use DateTimeImmutable;

/** Datos agregados para el dashboard: 6 consultas en total (antes eran 10). */
final class ObtenerDashboard
{
    private const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    public function __construct(private readonly ReporteRepository $reportes) {}

    public function __invoke(FiltrosReporte $f): array
    {
        $porLocal = $this->reportes->resumenPorLocal($f);
        $serie = $this->reportes->serieTemporal($f, porHora: true);
        $anterior = $f->anterior();
        $previo = $this->reportes->totales($anterior);

        // El resumen es la suma de los locales (no hace falta otra consulta)
        $suma = fn (string $campo) => array_sum(array_column($porLocal, $campo));
        $ingresos = $suma('total');
        $atenciones = (int) $suma('atenciones');

        return [
            'filtros' => [
                'desde' => $f->desde, 'hasta' => $f->hasta, 'hora_desde' => $f->horaDesde, 'hora_hasta' => $f->horaHasta,
                'local_id' => $f->alcance->unico(),
            ],
            'resumen' => [
                'ingresos' => $ingresos, 'atenciones' => $atenciones, 'servicios' => (int) $suma('servicios'),
                'ganancia_local' => $suma('local_neto'), 'pago_trabajadores' => $suma('trabajadores'),
                'ticket_promedio' => $atenciones ? $ingresos / $atenciones : 0,
            ],
            'anterior' => $previo + ['desde' => $anterior->desde, 'hasta' => $anterior->hasta],
            'por_local' => array_map(fn (array $l) => array_diff_key($l, ['servicios' => 1]), $porLocal),
            'por_fecha' => $this->porFecha($serie),
            'por_hora' => $this->porHora($serie),
            'por_dia' => $this->porDiaSemana($serie),
            'por_trabajador' => $this->reportes->porTrabajador($f, 50),
            'por_servicio' => array_slice($this->reportes->porServicio($f), 0, 10),
            'por_dia_trabajador' => $this->masYMenosPorDia($f),
        ];
    }

    private function porFecha(array $serie): array
    {
        $dias = [];
        foreach ($serie as $r) {
            $d = &$dias[$r['fecha']];
            $d = ['fecha' => $r['fecha'], 'total' => ($d['total'] ?? 0) + $r['total'], 'atenciones' => ($d['atenciones'] ?? 0) + $r['atenciones']];
            unset($d);
        }
        return array_values($dias);
    }

    private function porHora(array $serie): array
    {
        $horas = array_fill(0, 24, ['total' => 0.0, 'atenciones' => 0]);
        foreach ($serie as $r) {
            $horas[$r['hora']]['total'] += $r['total'];
            $horas[$r['hora']]['atenciones'] += $r['atenciones'];
        }
        return array_map(fn (int $h) => ['hora' => sprintf('%02d:00', $h)] + $horas[$h], array_keys($horas));
    }

    /** De lunes a domingo. */
    private function porDiaSemana(array $serie): array
    {
        $dias = array_fill(0, 7, ['total' => 0.0, 'atenciones' => 0]);
        foreach ($serie as $r) {
            $n = (int) (new DateTimeImmutable($r['fecha']))->format('w');   // 0 = domingo
            $dias[$n]['total'] += $r['total'];
            $dias[$n]['atenciones'] += $r['atenciones'];
        }
        return array_map(fn (int $n) => ['dia' => self::DIAS[$n]] + $dias[$n], [1, 2, 3, 4, 5, 6, 0]);
    }

    /** Quién hizo más y quién menos cada día (entre los que trabajaron ese día). Últimos 31 días. */
    private function masYMenosPorDia(FiltrosReporte $f): array
    {
        $porDia = [];
        foreach ($this->reportes->totalPorDiaYTrabajador($f) as $r) {   // ya viene de mayor a menor
            $porDia[$r['fecha']][] = ['trabajador' => $r['trabajador'], 'total' => $r['total']];
        }
        $resultado = [];
        foreach (array_slice($porDia, 0, 31, true) as $fecha => $dia) {
            $menos = count($dia) > 1 ? end($dia) : null;
            $resultado[] = ['fecha' => $fecha, 'mas' => $dia[0], 'menos' => $menos];
        }
        return $resultado;
    }
}
