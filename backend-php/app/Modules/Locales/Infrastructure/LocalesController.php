<?php

declare(strict_types=1);

namespace App\Modules\Locales\Infrastructure;

use App\Modules\Locales\Application\LocalesService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class LocalesController
{
    public function __construct(private readonly LocalesService $locales) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->locales->listar($request->attributes->get('alcance')));
    }

    public function show(string $id): JsonResponse
    {
        return response()->json($this->locales->obtener($id));
    }

    public function store(CrearLocalRequest $request): JsonResponse
    {
        return response()->json($this->locales->crear($request->datos()), 201);
    }

    public function destroy(string $id): JsonResponse
    {
        $this->locales->eliminar($id);
        return response()->json(['message' => 'Local, usuarios, trabajadores, servicios y ventas asociados eliminados exitosamente.']);
    }
}
