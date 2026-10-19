<?php

declare(strict_types=1);

namespace App\Modules\Reportes\Application;

use App\Core\Exceptions\ApiException;
use App\Core\Support\Alcance;
use App\Modules\Locales\Domain\LocalRepository;
use App\Modules\Reportes\Domain\FiltrosReporte;
use App\Modules\Reportes\Domain\ReporteRepository;
use DateTimeImmutable;

/** Detalle de un local para un periodo (day | week | month | year) que termina en `fecha`. */
final class ObtenerDetalleLocal
{
    public function __construct(private readonly ReporteRepository $reportes, private readonly LocalRepository $locales) {}

    public function __invoke(string $localId, string $periodo, string $fecha): array
    {
        if (! $this->locales->existe($localId)) {
            throw ApiException::noEncontrado('Local no encontrado.');
        }
        $fin = new DateTimeImmutable($fecha);
        $inicio = match ($periodo) {
            'day' => $fin,
            'week' => $fin->modify('-6 days'),
            'month' => $fin->modify('-29 days'),
            'year' => $fin->modify('first day of this month')->modify('-11 months'),
        };
        $f = new FiltrosReporte($inicio->format('Y-m-d'), $fin->format('Y-m-d'), null, null, Alcance::de([$localId]));

        $serie = $this->reportes->serieTemporal($f, porHora: $periodo === 'day');
        $servicios = $this->reportes->porServicio($f);
        $porCantidad = $servicios;
        usort($porCantidad, fn ($a, $b) => $b['cantidad'] <=> $a['cantidad']);
        $top = $this->reportes->porTrabajador($f, 1)[0] ?? null;
        $local = $this->reportes->resumenPorLocal($f)[0] ?? ['total' => 0, 'atenciones' => 0, 'servicios' => 0, 'local_neto' => 0, 'trabajadores' => 0];

        return [
            'tendencia' => $this->tendencia($periodo, $inicio, $serie),
            'distribucion' => array_map(fn ($s) => ['n' => $s['servicio'], 'v' => $s['cantidad']], $porCantidad),
            'metrics' => [
                'income' => $local['total'], 'services' => $local['servicios'], 'clients' => $local['atenciones'],
                'localShare' => $local['local_neto'], 'workersShare' => $local['trabajadores'],
                'topWorkerName' => $top['trabajador'] ?? 'Sin datos', 'topWorkerServices' => $top['servicios'] ?? 0,
                'topServiceName' => $porCantidad[0]['servicio'] ?? 'Sin datos', 'topServiceCount' => $porCantidad[0]['cantidad'] ?? 0,
            ],
        ];
    }

    /** Completa con ceros los tramos sin ventas: horas (día), días (semana/mes) o meses (año). */
    private function tendencia(string $periodo, DateTimeImmutable $inicio, array $serie): array
    {
        $totales = [];
        foreach ($serie as $r) {
            $clave = match ($periodo) {
                'day' => sprintf('%02d', $r['hora']),
                'year' => substr($r['fecha'], 0, 7),
                default => $r['fecha'],
            };
            $totales[$clave] = ($totales[$clave] ?? 0) + $r['total'];
        }
        $tramos = match ($periodo) {
            'day' => array_map(fn (int $h) => [sprintf('%02d', $h), sprintf('%02dh', $h)], range(0, 23)),
            'year' => array_map(function (int $i) use ($inicio) {
                $m = $inicio->modify("+{$i} months");
                return [$m->format('Y-m'), $m->format('m/y')];
            }, range(0, 11)),
            default => array_map(function (int $i) use ($inicio) {
                $d = $inicio->modify("+{$i} days");
                return [$d->format('Y-m-d'), $d->format('d/m')];
            }, range(0, $periodo === 'week' ? 6 : 29)),
        };
        return array_map(fn (array $t) => ['name' => $t[1], 'Ingresos' => $totales[$t[0]] ?? 0], $tramos);
    }
}
