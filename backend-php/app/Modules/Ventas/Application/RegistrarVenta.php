<?php

declare(strict_types=1);

namespace App\Modules\Ventas\Application;

use App\Core\Auth\AuthUser;
use App\Core\Exceptions\ApiException;
use App\Core\Support\Redondeo;
use App\Modules\Servicios\Domain\ServicioRepository;
use App\Modules\Trabajadores\Domain\TrabajadorRepository;
use App\Modules\Ventas\Domain\Reparto;
use App\Modules\Ventas\Domain\VentaRepository;
use Illuminate\Support\Carbon;

/**
 * Una venta es lo que el cliente paga al entregar su ticket: uno o varios servicios, cada uno con su
 * precio (ajustable), el trabajador que lo hizo y el reparto trabajador/local vigente en ese momento.
 */
final class RegistrarVenta
{
    public function __construct(
        private readonly VentaRepository $ventas,
        private readonly ServicioRepository $servicios,
        private readonly TrabajadorRepository $trabajadores,
    ) {}

    /**
     * @param list<array{servicio_id:string,trabajador_id:string,precio:float}> $items
     * @param string|null $fecha YYYY-MM-DD (venta de un día pasado); null = ahora
     */
    public function __invoke(AuthUser $usuario, string $localId, string $metodo, array $items, ?string $fecha): array
    {
        // Una consulta para todos los servicios y otra para todos los trabajadores (no una por ítem)
        $servicios = $this->servicios->porIds(array_column($items, 'servicio_id'));
        $trabajadores = $this->trabajadores->activosEnLocal(array_column($items, 'trabajador_id'), $localId);

        $lineas = [];
        foreach ($items as $item) {
            $servicio = $servicios[$item['servicio_id']] ?? null;
            if (! $servicio || $servicio['local_id'] !== $localId) {
                throw ApiException::invalido('Un servicio no pertenece a este local.');
            }
            $nombreTrabajador = $trabajadores[$item['trabajador_id']]
                ?? throw ApiException::invalido('Un trabajador no está activo en este local.');

            $precio = Redondeo::dinero($item['precio']);
            $reparto = Reparto::calcular($precio, $servicio['porcentaje_trabajador']);
            $lineas[] = [
                'servicio_id' => $item['servicio_id'], 'servicio_nombre' => $servicio['nombre'],
                'trabajador_id' => $item['trabajador_id'], 'trabajador_nombre' => $nombreTrabajador,
                'precio' => $precio, 'porcentaje_trabajador' => $servicio['porcentaje_trabajador'],
                'monto_trabajador' => $reparto->trabajador, 'monto_local' => $reparto->local,
            ];
        }

        return $this->ventas->registrar($localId, $this->momento($fecha), $metodo, $usuario->username, $lineas);
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
