<?php

declare(strict_types=1);

namespace App\Modules\Auth\Infrastructure;

use App\Core\ApiException;
use App\Modules\Auth\Application\AuthService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Middleware "auth.jwt": exige "Authorization: Bearer <token>" y deja al usuario en $request->user(). */
final class Autenticar
{
    public function __construct(private readonly AuthService $auth) {}

    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken() ?? throw ApiException::noAutenticado();
        $usuario = $this->auth->autenticar($token);

        $request->setUserResolver(fn () => $usuario);
        return $next($request);
    }
}
