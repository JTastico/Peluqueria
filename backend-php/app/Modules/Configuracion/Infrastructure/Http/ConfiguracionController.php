<?php

declare(strict_types=1);

namespace App\Modules\Configuracion\Infrastructure\Http;

use App\Modules\Configuracion\Application\GestionarConfiguracion;
use Illuminate\Http\JsonResponse;

final class ConfiguracionController
{
    public function __construct(private readonly GestionarConfiguracion $config) {}

    public function show(): JsonResponse
    {
        return response()->json($this->config->obtener());
    }

    public function update(ConfiguracionRequest $request): JsonResponse
    {
        return response()->json($this->config->actualizar($request->cambios()));
    }
}
