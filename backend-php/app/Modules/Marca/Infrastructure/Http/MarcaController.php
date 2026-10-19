<?php

declare(strict_types=1);

namespace App\Modules\Marca\Infrastructure\Http;

use App\Modules\Marca\Application\GestionarMarca;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

final class MarcaController
{
    public function __construct(private readonly GestionarMarca $marca) {}

    public function show(): JsonResponse
    {
        return response()->json($this->marca->obtener());
    }

    public function logo(Request $request): Response
    {
        $logo = $this->marca->logo();
        $respuesta = response($logo['bytes'], 200, ['Content-Type' => $logo['mime']])
            ->setEtag($logo['version'])->setPublic()->setMaxAge(300);
        $respuesta->isNotModified($request);   // responde 304 si el navegador ya tiene esta versión
        return $respuesta;
    }

    public function guardarTema(TemaRequest $request): JsonResponse
    {
        $v = $request->validated();
        return response()->json($this->marca->guardarTema($v['primario'], $v['secundario'], $request->preset()));
    }

    public function guardarLogo(LogoRequest $request): JsonResponse
    {
        return response()->json($this->marca->guardarLogo($request->validated('mime'), $request->validated('datos')));
    }

    public function eliminarLogo(): JsonResponse
    {
        return response()->json($this->marca->eliminarLogo());
    }
}
