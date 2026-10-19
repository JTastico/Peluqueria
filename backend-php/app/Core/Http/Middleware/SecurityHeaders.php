<?php

declare(strict_types=1);

namespace App\Core\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        header_remove('X-Powered-By');
        $response = $next($request);
        $response->headers->add([
            'X-Content-Type-Options' => 'nosniff',
            'X-Frame-Options' => 'DENY',
            'Referrer-Policy' => 'no-referrer',
            'Cross-Origin-Resource-Policy' => 'cross-origin',
            'Content-Security-Policy' => "default-src 'none'; frame-ancestors 'none'",
        ]);
        if ($request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=15552000');
        }
        return $response;
    }
}
