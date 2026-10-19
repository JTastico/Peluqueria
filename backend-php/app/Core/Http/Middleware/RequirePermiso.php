<?php

declare(strict_types=1);

namespace App\Core\Http\Middleware;

use App\Core\ApiException;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Uso: ->middleware('permiso:ventas.registrar,ventas.ver_local')  (pasa con al menos uno). */
final class RequirePermiso
{
    public function handle(Request $request, Closure $next, string ...$permisos): Response
    {
        if (! $request->user()?->puede(...$permisos)) {
            throw ApiException::prohibido();
        }
        return $next($request);
    }
}
