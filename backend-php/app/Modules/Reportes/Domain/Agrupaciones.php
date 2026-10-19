<?php

declare(strict_types=1);

namespace App\Modules\Reportes\Domain;

use DateTimeImmutable;

/**
 * Cálculos puros sobre la serie de ventas [{fecha, hora, total, atenciones}] que devuelve el
 * repositorio: agrupar por día, hora, día de la semana o tramo, completando con ceros los huecos.
 */
final class Agrupaciones
{
    private const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    public static function porFecha(array $serie): array
    {
        $dias = [];
        foreach ($serie as $r) {
            $dias[$r['fecha']] ??= ['fecha' => $r['fecha'], 'total' => 0.0, 'atenciones' => 0];
            $dias[$r['fecha']]['total'] += $r['total'];
            $dias[$r['fecha']]['atenciones'] += $r['atenciones'];
        }
        return array_values($dias);
    }

    /** Las 24 horas del día, de 00:00 a 23:00. */
    public static function porHora(array $serie): array
    {
        $horas = self::sumar($serie, fn (array $r) => $r['hora'], range(0, 23));
        return array_map(fn (int $h) => ['hora' => sprintf('%02d:00', $h)] + $horas[$h], range(0, 23));
    }

    /** De lunes a domingo. */
    public static function porDiaSemana(array $serie): array
    {
        $dias = self::sumar($serie, fn (array $r) => (int) (new DateTimeImmutable($r['fecha']))->format('w'), range(0, 6));
        return array_map(fn (int $n) => ['dia' => self::DIAS[$n]] + $dias[$n], [1, 2, 3, 4, 5, 6, 0]);
    }

    /**
     * Quién hizo más y quién menos cada día (entre los que trabajaron ese día).
     *
     * @param array $filas [{fecha, trabajador, total}] ordenadas por fecha desc y total desc
     */
    public static function masYMenosPorDia(array $filas, int $maxDias = 31): array
    {
        $porDia = [];
        foreach ($filas as $r) {
            $porDia[$r['fecha']][] = ['trabajador' => $r['trabajador'], 'total' => $r['total']];
        }
        $resultado = [];
        foreach (array_slice($porDia, 0, $maxDias, true) as $fecha => $dia) {
            $resultado[] = ['fecha' => $fecha, 'mas' => $dia[0], 'menos' => count($dia) > 1 ? end($dia) : null];
        }
        return $resultado;
    }

    /** Ingresos por tramo: horas (day), días (week/month) o meses (year), desde $desde. */
    public static function tendencia(string $periodo, string $desde, array $serie): array
    {
        $inicio = new DateTimeImmutable($desde);
        $clave = match ($periodo) {
            'day' => fn (array $r) => sprintf('%02d', $r['hora']),
            'year' => fn (array $r) => substr($r['fecha'], 0, 7),
            default => fn (array $r) => $r['fecha'],
        };
        $tramos = match ($periodo) {
            'day' => array_map(fn (int $h) => [sprintf('%02d', $h), sprintf('%02dh', $h)], range(0, 23)),
            'year' => array_map(fn (int $i) => [$inicio->modify("+{$i} months")->format('Y-m'), $inicio->modify("+{$i} months")->format('m/y')], range(0, 11)),
            default => array_map(fn (int $i) => [$inicio->modify("+{$i} days")->format('Y-m-d'), $inicio->modify("+{$i} days")->format('d/m')], range(0, $periodo === 'week' ? 6 : 29)),
        };

        $totales = [];
        foreach ($serie as $r) {
            $totales[$clave($r)] = ($totales[$clave($r)] ?? 0) + $r['total'];
        }
        return array_map(fn (array $t) => ['name' => $t[1], 'Ingresos' => $totales[$t[0]] ?? 0], $tramos);
    }

    /** Suma total y atenciones por la clave indicada, partiendo de cero en todas las claves. */
    private static function sumar(array $serie, callable $clave, array $claves): array
    {
        $acumulado = array_fill_keys($claves, ['total' => 0.0, 'atenciones' => 0]);
        foreach ($serie as $r) {
            $k = $clave($r);
            $acumulado[$k]['total'] += $r['total'];
            $acumulado[$k]['atenciones'] += $r['atenciones'];
        }
        return $acumulado;
    }
}
