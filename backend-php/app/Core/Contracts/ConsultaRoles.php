<?php

declare(strict_types=1);

namespace App\Core\Contracts;

/** Puerto de lectura de roles que necesita el núcleo para armar al usuario autenticado. */
interface ConsultaRoles
{
    /** @return array{nombre:string,alcance:string,permisos:list<string>}|null */
    public function obtener(string $rolId): ?array;
}
