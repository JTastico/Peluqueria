<?php

declare(strict_types=1);

namespace App\Modules\Configuracion\Infrastructure;

use App\Modules\Configuracion\Application\ConfiguracionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

final class ConfiguracionController
{
    public function __construct(private readonly ConfiguracionService $config) {}

    public function show(): JsonResponse
    {
        return response()->json($this->config->datosNegocio());
    }

    public function update(ConfiguracionRequest $r): JsonResponse
    {
        return response()->json($this->config->actualizarDatosNegocio($r->cambios()));
    }

    public function marca(): JsonResponse
    {
        return response()->json($this->config->marca());
    }

    public function logo(Request $request): Response
    {
        $logo = $this->config->logo();
        $respuesta = response($logo['bytes'], 200, ['Content-Type' => $logo['mime']])
            ->setEtag($logo['version'])->setPublic()->setMaxAge(300);
        $respuesta->isNotModified($request);   // 304 si el navegador ya tiene esta versión
        return $respuesta;
    }

    public function guardarTema(TemaRequest $r): JsonResponse
    {
        return response()->json($this->config->guardarTema($r->validated('primario'), $r->validated('secundario'), $r->preset()));
    }

    public function guardarLogo(LogoRequest $r): JsonResponse
    {
        return response()->json($this->config->guardarLogo($r->validated('mime'), $r->validated('datos')));
    }

    public function eliminarLogo(): JsonResponse
    {
        return response()->json($this->config->eliminarLogo());
    }
}
