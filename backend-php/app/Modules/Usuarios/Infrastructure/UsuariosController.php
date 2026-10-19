<?php

declare(strict_types=1);

namespace App\Modules\Usuarios\Infrastructure;

use App\Modules\Usuarios\Application\UsuariosService;
use Illuminate\Http\JsonResponse;

final class UsuariosController
{
    public function __construct(private readonly UsuariosService $usuarios) {}

    public function index(): JsonResponse
    {
        return response()->json($this->usuarios->listar());
    }

    public function update(CambiarRolRequest $request, string $id): JsonResponse
    {
        $v = $request->validated();
        return response()->json($this->usuarios->cambiarRol($request->user()->id, $id, $v['rol'], $v['locales'] ?? []));
    }
}
