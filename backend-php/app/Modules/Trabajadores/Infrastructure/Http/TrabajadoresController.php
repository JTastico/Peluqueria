<?php

declare(strict_types=1);

namespace App\Modules\Trabajadores\Infrastructure\Http;

use App\Modules\Trabajadores\Application\GestionarTrabajadores;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class TrabajadoresController
{
    public function __construct(private readonly GestionarTrabajadores $trabajadores) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->trabajadores->listar($request->attributes->get('alcance')));
    }

    public function store(CrearTrabajadorRequest $r): JsonResponse
    {
        $v = $r->validated();
        return response()->json($this->trabajadores->crear(
            trim($v['nombre']), trim($v['apellido'] ?? ''), ($t = trim($v['telefono'] ?? '')) !== '' ? $t : null, $v['local_id']
        ), 201);
    }

    public function destroy(string $id): JsonResponse
    {
        $this->trabajadores->eliminar($id);
        return response()->json(['message' => 'Trabajador eliminado. Sus ventas registradas se conservan.']);
    }

    public function transferir(TrasladoRequest $r, string $id): JsonResponse
    {
        $v = $r->validated();
        return response()->json($this->trabajadores->trasladar($r->user(), $id, $v['local_destino'] ?? $v['local_id'], trim($v['motivo'] ?? '')));
    }

    public function agregarALocal(TrasladoRequest $r, string $id): JsonResponse
    {
        $v = $r->validated();
        return response()->json($this->trabajadores->agregarALocal($r->user(), $id, $v['local_id'] ?? $v['local_destino']));
    }

    public function cambiarEstado(EstadoRequest $r, string $id, string $localId): JsonResponse
    {
        return response()->json($this->trabajadores->cambiarEstado($id, $localId, $r->validated('estado')));
    }

    public function historial(Request $request, string $id): JsonResponse
    {
        return response()->json($this->trabajadores->historial($request->user(), $id));
    }
}
