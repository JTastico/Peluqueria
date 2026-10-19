<?php

declare(strict_types=1);

namespace App\Core\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Confía en X-Forwarded-* solo si TRUSTED_PROXIES lo indica: así el límite de peticiones ve la IP real. */
final class ConfiarEnProxies
{
    public function handle(Request $request, Closure $next): Response
    {
        $proxies = trim((string) config('seguridad.proxies'));
        if ($proxies !== '') {
            Request::setTrustedProxies(
                $proxies === '*' ? ['0.0.0.0/0', '2000:0:0:0:0:0:0:0/3'] : array_map('trim', explode(',', $proxies)),
                Request::HEADER_X_FORWARDED_FOR | Request::HEADER_X_FORWARDED_HOST | Request::HEADER_X_FORWARDED_PORT | Request::HEADER_X_FORWARDED_PROTO
            );
        }
        return $next($request);
    }
}
