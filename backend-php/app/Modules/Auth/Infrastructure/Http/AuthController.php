<?php

declare(strict_types=1);

namespace App\Modules\Auth\Infrastructure\Http;

use App\Modules\Auth\Application\GestionarCuenta;
use App\Modules\Auth\Application\IniciarSesion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AuthController
{
    public function login(LoginRequest $request, IniciarSesion $iniciarSesion): JsonResponse
    {
        return response()->json($iniciarSesion($request->validated('username'), $request->validated('password')));
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $request->user()->publico()]);
    }

    public function cambiarPassword(CambiarPasswordRequest $request, GestionarCuenta $cuenta): JsonResponse
    {
        $cuenta->cambiarPassword($request->user(), $request->validated('actual'), $request->validated('nueva'));
        return response()->json(['message' => 'Contraseña actualizada.']);
    }

    public function preferencias(PreferenciasRequest $request, GestionarCuenta $cuenta): JsonResponse
    {
        return response()->json($cuenta->guardarPreferencias($request->user(), $request->validated('fuente'), $request->validated('tamano')));
    }
}
