<?php

declare(strict_types=1);

namespace App\Modules\Ventas\Application;

use App\Core\Alcance;
use App\Core\ApiException;
use App\Core\AuthUser;
use App\Modules\Servicios\Domain\ServicioRepository;
use App\Modules\Trabajadores\Domain\TrabajadorRepository;
use App\Modules\Ventas\Domain\Reparto;
use App\Modules\Ventas\Domain\VentaRepository;
use Illuminate\Support\Carbon;

/**
 * Una venta es lo que el cliente paga al entregar su ticket: uno o varios servicios, cada uno con su
 * precio (ajustable), el trabajador que lo hizo y el reparto trabajador/local vigente en ese momento.
 */
final class VentasService
{
    public function __construct(
        private readonly VentaRepository $ventas,
        private readonly ServicioRepository $servicios,
        private readonly TrabajadorRepository $trabajadores,
    ) {}

    /** "fecha" es un solo día; también se puede pedir un rango desde/hasta. */
    public function listar(Alcance $alcance, ?string $fecha, ?string $desde, ?string $hasta): array
    {
        return $this->ventas->listar($alcance, $fecha ?: $desde, $fecha ?: $hasta);
    }

    /**
     * @param list<array{servicio_id:string,trabajador_id:string,precio:float}> $items
     * @param string|null $fecha YYYY-MM-DD de un día pasado; null = ahora
     */
    public function registrar(AuthUser $usuario, string $localId, string $metodo, array $items, ?string $fecha): array
    {
        // Una consulta para todos los servicios y otra para todos los trabajadores (no una por ítem)
        $servicios = $this->servicios->porIds(array_column($items, 'servicio_id'));
        $trabajadores = $this->trabajadores->activosEnLocal(array_column($items, 'trabajador_id'), $localId);

        $lineas = array_map(function (array $item) use ($servicios, $trabajadores, $localId) {
            $servicio = $servicios[$item['servicio_id']] ?? null;
            if (! $servicio || $servicio['local_id'] !== $localId) {
                throw ApiException::invalido('Un servicio no pertenece a este local.');
            }
            $trabajador = $trabajadores[$item['trabajador_id']]
                ?? throw ApiException::invalido('Un trabajador no está activo en este local.');

            $precio = round($item['precio'], 2);
            $reparto = Reparto::calcular($precio, $servicio['porcentaje_trabajador']);
            return [
                'servicio_id' => $item['servicio_id'], 'servicio_nombre' => $servicio['nombre'],
                'trabajador_id' => $item['trabajador_id'], 'trabajador_nombre' => $trabajador,
                'precio' => $precio, 'porcentaje_trabajador' => $servicio['porcentaje_trabajador'],
                'monto_trabajador' => $reparto->trabajador, 'monto_local' => $reparto->local,
            ];
        }, $items);

        return $this->ventas->registrar($localId, $this->momento($fecha), $metodo, $usuario->username, $lineas);
    }

    public function anular(string $id): array
    {
        return match ($this->ventas->anular($id)) {
            null => throw ApiException::noEncontrado('Venta no encontrada.'),
            false => throw ApiException::conflicto('La venta ya estaba anulada.'),
            true => $this->ventas->obtener($id),
        };
    }

    /** Hoy: la hora actual. Otro día pasado: ese día, a la hora en que se anota. */
    private function momento(?string $fecha): Carbon
    {
        if ($fecha === null || $fecha === '' || $fecha === now()->toDateString()) {
            return now();
        }
        return Carbon::createFromFormat('Y-m-d', $fecha)->setTimeFrom(now());
    }
}
