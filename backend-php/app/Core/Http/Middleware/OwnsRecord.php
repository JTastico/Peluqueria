<?php

declare(strict_types=1);

namespace App\Core\Http\Middleware;

use App\Core\Exceptions\ApiException;
use App\Models\Producto;
use App\Models\Servicio;
use App\Models\Trabajador;
use App\Models\Venta;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Para rutas /{id} de un registro con local_id: solo los de locales dentro del alcance del usuario.
 * Uso: ->middleware('owns:servicios'). Las tablas permitidas son fijas, nunca vienen del cliente.
 */
final class OwnsRecord
{
    private const MODELOS = [
        'servicios' => Servicio::class,
        'trabajadores' => Trabajador::class,
        'productos' => Producto::class,
        'ventas' => Venta::class,
    ];

    public function handle(Request $request, Closure $next, string $recurso): Response
    {
        $modelo = self::MODELOS[$recurso] ?? throw new \LogicException("Recurso no permitido: {$recurso}");
        $usuario = $request->user();

        if (! $usuario->esGlobal()) {
            $localId = $modelo::query()->whereKey($request->route('id'))->value('local_id');
            if ($localId === null || ! $usuario->puedeVerLocal($localId)) {
                throw ApiException::noEncontrado();
            }
        }
        return $next($request);
    }
}
