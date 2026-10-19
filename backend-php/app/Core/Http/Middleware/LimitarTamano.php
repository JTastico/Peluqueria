<?php

declare(strict_types=1);

namespace App\Core\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Rechaza cuerpos enormes antes de procesarlos: 100 KB en general, 1 MB solo para subir el logo. */
final class LimitarTamano
{
    private const GENERAL = 100 * 1024;
    private const LOGO = 1024 * 1024;

    public function handle(Request $request, Closure $next): Response
    {
        $maximo = $request->is('api/configuracion/logo') ? self::LOGO : self::GENERAL;
        $tamano = (int) $request->header('Content-Length', '0');
        if ($tamano > $maximo || strlen($request->getContent()) > $maximo) {
            return response()->json(['message' => 'La petición es demasiado grande.'], 413);
        }
        return $next($request);
    }
}
