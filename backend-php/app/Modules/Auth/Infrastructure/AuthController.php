<?php

declare(strict_types=1);

namespace App\Modules\Auth\Infrastructure;

use App\Modules\Auth\Application\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AuthController
{
    public function __construct(private readonly AuthService $auth) {}

    public function login(LoginRequest $r): JsonResponse
    {
        return response()->json($this->auth->login($r->validated('username'), $r->validated('password')));
    }

    public function me(Request $r): JsonResponse
    {
        return response()->json(['user' => $r->user()->publico()]);
    }

    public function cambiarPassword(CambiarPasswordRequest $r): JsonResponse
    {
        $this->auth->cambiarPassword($r->user(), $r->validated('actual'), $r->validated('nueva'));
        return response()->json(['message' => 'Contraseña actualizada.']);
    }

    public function preferencias(PreferenciasRequest $r): JsonResponse
    {
        return response()->json($this->auth->guardarPreferencias($r->user(), $r->validated('fuente'), $r->validated('tamano')));
    }
}
