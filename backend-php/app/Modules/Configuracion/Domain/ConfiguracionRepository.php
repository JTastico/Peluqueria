<?php

declare(strict_types=1);

namespace App\Modules\Configuracion\Domain;

/** Puerto de la tabla clave/valor de configuración del negocio (datos, tema y logo). */
interface ConfiguracionRepository
{
    /** Todas las claves menos los bytes del logo (pesados). @return array<string,string> */
    public function todas(): array;

    /** Los bytes del logo en base64, o null si no hay. */
    public function logoDatos(): ?string;

    /** @param array<string,string> $pares */
    public function guardar(array $pares): void;
}
