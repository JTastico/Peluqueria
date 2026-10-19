<?php

declare(strict_types=1);

namespace App\Core\Http\Middleware;

use App\Core\Exceptions\ApiException;
use App\Core\Support\Alcance;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Fija el alcance de locales de la petición ("alcance" en los atributos). Si se pide un local con
 * ?local_id debe estar dentro del alcance del usuario.
 */
final class ResolveLocalScope
{
    public function handle(Request $request, Closure $next): Response
    {
        $usuario = $request->user();
        $pedido = $request->query('local_id');
        if ($pedido !== null && $pedido !== '' && (! is_string($pedido) || ! Str::isUuid($pedido))) {
            throw ApiException::invalido("Identificador inválido en 'local_id'.");
        }
        $pedido = $pedido ?: null;

        if ($pedido !== null && ! $usuario->puedeVerLocal($pedido)) {
            throw ApiException::prohibido('No tienes acceso a ese local.');
        }
        $alcance = $pedido !== null ? Alcance::de([$pedido]) : $usuario->alcanceLocales();
        $request->attributes->set('alcance', $alcance);

        return $next($request);
    }
}
