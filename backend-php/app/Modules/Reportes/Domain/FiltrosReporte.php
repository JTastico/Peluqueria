<?php

declare(strict_types=1);

namespace App\Modules\Reportes\Domain;

use App\Core\ApiException;
use App\Core\Alcance;
use DateInterval;
use DateTimeImmutable;

/** Periodo, franja horaria y locales de un reporte. Todo se calcula sobre ventas activas. */
final class FiltrosReporte
{
    public function __construct(
        public readonly string $desde,        // YYYY-MM-DD (incluido)
        public readonly string $hasta,        // YYYY-MM-DD (incluido)
        public readonly ?string $horaDesde,   // HH:MM
        public readonly ?string $horaHasta,   // HH:MM
        public readonly Alcance $alcance,
    ) {
        if ($desde > $hasta) {
            throw ApiException::invalido('La fecha inicial no puede ser mayor a la final.');
        }
        if ($horaDesde && $horaHasta && $horaDesde > $horaHasta) {
            throw ApiException::invalido('La hora inicial no puede ser mayor a la final.');
        }
    }

    /** Por defecto: los últimos 30 días. */
    public static function crear(?string $desde, ?string $hasta, ?string $horaDesde, ?string $horaHasta, Alcance $alcance): self
    {
        $hoy = new DateTimeImmutable('today');
        return new self(
            $desde ?: $hoy->sub(new DateInterval('P29D'))->format('Y-m-d'),
            $hasta ?: $hoy->format('Y-m-d'),
            $horaDesde ?: null, $horaHasta ?: null, $alcance
        );
    }

    /** Periodo que termina en $fecha: day (ese día), week (7 días), month (30 días) o year (12 meses). */
    public static function delPeriodo(string $periodo, string $fecha, Alcance $alcance): self
    {
        $fin = new DateTimeImmutable($fecha);
        $inicio = match ($periodo) {
            'day' => $fin,
            'week' => $fin->modify('-6 days'),
            'month' => $fin->modify('-29 days'),
            'year' => $fin->modify('first day of this month')->modify('-11 months'),
        };
        return new self($inicio->format('Y-m-d'), $fin->format('Y-m-d'), null, null, $alcance);
    }

    /** Rango [inicio, fin) listo para comparar contra fecha_hora sin envolver la columna en funciones. */
    public function inicio(): string
    {
        return "{$this->desde} 00:00:00";
    }

    public function finExclusivo(): string
    {
        return (new DateTimeImmutable($this->hasta))->modify('+1 day')->format('Y-m-d').' 00:00:00';
    }

    public function dias(): int
    {
        return (int) (new DateTimeImmutable($this->desde))->diff(new DateTimeImmutable($this->hasta))->days + 1;
    }

    /** El periodo anterior de igual duración (para mostrar la variación en las tarjetas). */
    public function anterior(): self
    {
        $hasta = (new DateTimeImmutable($this->desde))->modify('-1 day');
        $desde = $hasta->modify('-'.($this->dias() - 1).' days');
        return new self($desde->format('Y-m-d'), $hasta->format('Y-m-d'), $this->horaDesde, $this->horaHasta, $this->alcance);
    }

    public function conAlcance(Alcance $alcance): self
    {
        return new self($this->desde, $this->hasta, $this->horaDesde, $this->horaHasta, $alcance);
    }
}
