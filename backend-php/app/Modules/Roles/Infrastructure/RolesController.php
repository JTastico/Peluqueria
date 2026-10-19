<?php

declare(strict_types=1);

namespace App\Modules\Roles\Infrastructure;

use App\Modules\Roles\Application\RolesService;
use Illuminate\Http\JsonResponse;

final class RolesController
{
    public function __construct(private readonly RolesService $roles) {}

    public function index(): JsonResponse
    {
        return response()->json($this->roles->listar());
    }

    public function store(RolRequest $request): JsonResponse
    {
        return response()->json($this->roles->crear($request->datos()), 201);
    }

    public function update(RolRequest $request, string $id): JsonResponse
    {
        return response()->json($this->roles->actualizar($id, $request->datos()));
    }

    public function destroy(string $id): JsonResponse
    {
        $this->roles->eliminar($id);
        return response()->json(['message' => 'Rol eliminado.']);
    }
}
