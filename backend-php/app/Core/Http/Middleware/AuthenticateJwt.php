<?php

declare(strict_types=1);

namespace App\Core\Http\Middleware;

use App\Core\Auth\CargadorUsuario;
use App\Core\Contracts\TokenIssuer;
use App\Core\Exceptions\ApiException;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Exige "Authorization: Bearer <token>" y deja al usuario en $request->user(). */
final class AuthenticateJwt
{
    public function __construct(private readonly TokenIssuer $tokens, private readonly CargadorUsuario $cargador) {}

    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();
        if (! $token) {
            throw ApiException::noAutenticado();
        }
        $usuario = $this->cargador->cargar($this->tokens->usuarioDe($token))
            ?? throw ApiException::noAutenticado('El usuario ya no existe.');

        $request->setUserResolver(fn () => $usuario);
        return $next($request);
    }
}
