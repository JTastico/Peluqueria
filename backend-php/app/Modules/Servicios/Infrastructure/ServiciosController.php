<?php

declare(strict_types=1);

namespace App\Modules\Servicios\Infrastructure;

use App\Modules\Servicios\Application\ServiciosService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ServiciosController
{
    public function __construct(private readonly ServiciosService $servicios) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->servicios->listar($request->attributes->get('alcance')));
    }

    public function store(ServicioRequest $r): JsonResponse
    {
        return response()->json($this->servicios->crear($r->user(), $r->nombre(), $r->precio(), $r->porcentaje(), $r->locales()), 201);
    }

    public function update(ServicioRequest $r, string $id): JsonResponse
    {
        return response()->json($this->servicios->actualizar($id, $r->nombre(), $r->precio(), $r->porcentaje()));
    }

    public function destroy(string $id): JsonResponse
    {
        $this->servicios->eliminar($id);
        return response()->json(['message' => 'Servicio eliminado. Las ventas ya registradas se conservan.']);
    }
}
