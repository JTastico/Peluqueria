<?php

declare(strict_types=1);

namespace App\Core\Http\Middleware;

use App\Core\ApiException;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Para /locales/{id} y similares: el local debe estar dentro del alcance del usuario. */
final class OwnsLocalParam
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()->puedeVerLocal((string) $request->route('id'))) {
            throw ApiException::prohibido('No tienes acceso a ese local.');
        }
        return $next($request);
    }
}
