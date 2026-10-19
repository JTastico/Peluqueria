<?php

declare(strict_types=1);

namespace App\Core\Http\Middleware;

use App\Core\ApiException;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Para POST/PUT con local_id en el cuerpo: debe estar dentro del alcance del usuario.
 * Si falta y el usuario solo llega a un local, se usa ese.
 */
final class EnforceBodyLocal
{
    public function handle(Request $request, Closure $next): Response
    {
        $usuario = $request->user();
        $enviado = $request->input('local_id');

        if ($enviado !== null && $enviado !== '') {
            if (! is_string($enviado) || ! Str::isUuid($enviado)) {
                throw ApiException::invalido("Identificador inválido en 'local_id'.");
            }
            if (! $usuario->puedeVerLocal($enviado)) {
                throw ApiException::prohibido('No tienes acceso a ese local.');
            }
            return $next($request);
        }
        if ($usuario->esGlobal()) {
            return $next($request);
        }
        $ids = $usuario->alcanceLocales()->ids() ?? [];
        if (count($ids) !== 1) {
            throw ApiException::invalido('Indica el local.');
        }
        $request->merge(['local_id' => $ids[0]]);
        return $next($request);
    }
}
