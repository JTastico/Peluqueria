<?php

declare(strict_types=1);

namespace App\Modules\Reportes\Application;

use App\Core\Alcance;
use App\Core\ApiException;
use App\Modules\Locales\Domain\LocalRepository;
use App\Modules\Reportes\Domain\Agrupaciones;
use App\Modules\Reportes\Domain\FiltrosReporte;
use App\Modules\Reportes\Domain\ReporteRepository;

/** Reportes sobre ventas activas: liquidación, dashboard y detalle de un local. */
final class ReportesService
{
    private const SIN_VENTAS = ['total' => 0, 'atenciones' => 0, 'servicios' => 0, 'local_neto' => 0, 'trabajadores' => 0];

    public function __construct(private readonly ReporteRepository $reportes, private readonly LocalRepository $locales) {}

    /** Lo vendido por cada trabajador en cada local y lo que le toca a él y al local. */
    public function liquidacion(FiltrosReporte $f): array
    {
        return $this->reportes->liquidacion($f);
    }

    /** Dashboard: 6 consultas; el resumen se obtiene sumando los locales. */
    public function dashboard(FiltrosReporte $f): array
    {
        $porLocal = $this->reportes->resumenPorLocal($f);
        $serie = $this->reportes->serieTemporal($f, porHora: true);
        $anterior = $f->anterior();

        $suma = fn (string $campo) => array_sum(array_column($porLocal, $campo));
        $ingresos = $suma('total');
        $atenciones = (int) $suma('atenciones');

        return [
            'filtros' => ['desde' => $f->desde, 'hasta' => $f->hasta, 'hora_desde' => $f->horaDesde,
                'hora_hasta' => $f->horaHasta, 'local_id' => $f->alcance->unico()],
            'resumen' => [
                'ingresos' => $ingresos, 'atenciones' => $atenciones, 'servicios' => (int) $suma('servicios'),
                'ganancia_local' => $suma('local_neto'), 'pago_trabajadores' => $suma('trabajadores'),
                'ticket_promedio' => $atenciones ? $ingresos / $atenciones : 0,
            ],
            'anterior' => $this->reportes->totales($anterior) + ['desde' => $anterior->desde, 'hasta' => $anterior->hasta],
            'por_local' => array_map(fn (array $l) => array_diff_key($l, ['servicios' => 1]), $porLocal),
            'por_fecha' => Agrupaciones::porFecha($serie),
            'por_hora' => Agrupaciones::porHora($serie),
            'por_dia' => Agrupaciones::porDiaSemana($serie),
            'por_trabajador' => $this->reportes->porTrabajador($f, 50),
            'por_servicio' => array_slice($this->reportes->porServicio($f), 0, 10),
            'por_dia_trabajador' => Agrupaciones::masYMenosPorDia($this->reportes->totalPorDiaYTrabajador($f)),
        ];
    }

    /** Detalle de un local para un periodo (day | week | month | year) que termina en $fecha. */
    public function detalleLocal(string $localId, string $periodo, string $fecha): array
    {
        if (! $this->locales->existe($localId)) {
            throw ApiException::noEncontrado('Local no encontrado.');
        }
        $f = FiltrosReporte::delPeriodo($periodo, $fecha, Alcance::de([$localId]));

        $servicios = $this->reportes->porServicio($f);
        usort($servicios, fn ($a, $b) => $b['cantidad'] <=> $a['cantidad']);   // los más pedidos primero
        $top = $this->reportes->porTrabajador($f, 1)[0] ?? null;
        $local = $this->reportes->resumenPorLocal($f)[0] ?? self::SIN_VENTAS;

        return [
            'tendencia' => Agrupaciones::tendencia($periodo, $f->desde, $this->reportes->serieTemporal($f, porHora: $periodo === 'day')),
            'distribucion' => array_map(fn ($s) => ['n' => $s['servicio'], 'v' => $s['cantidad']], $servicios),
            'metrics' => [
                'income' => $local['total'], 'services' => $local['servicios'], 'clients' => $local['atenciones'],
                'localShare' => $local['local_neto'], 'workersShare' => $local['trabajadores'],
                'topWorkerName' => $top['trabajador'] ?? 'Sin datos', 'topWorkerServices' => $top['servicios'] ?? 0,
                'topServiceName' => $servicios[0]['servicio'] ?? 'Sin datos', 'topServiceCount' => $servicios[0]['cantidad'] ?? 0,
            ],
        ];
    }
}
