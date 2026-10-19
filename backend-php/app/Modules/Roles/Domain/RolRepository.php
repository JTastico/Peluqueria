<?php

declare(strict_types=1);

namespace App\Modules\Roles\Domain;

use App\Core\Contracts\ConsultaRoles;

/** Puerto de persistencia de roles y sus permisos. */
interface RolRepository extends ConsultaRoles
{
    /** @return list<array{id:string,nombre:string,descripcion:string,alcance:string,es_sistema:bool,usuarios:int,permisos:list<string>}> */
    public function todos(): array;

    public function existe(string $id): bool;

    public function esDeSistema(string $id): bool;

    public function contarUsuarios(string $id): int;

    /** @param array{nombre:string,descripcion:string,alcance:string,permisos:list<string>} $datos */
    public function crear(string $id, array $datos): void;

    /** @param array{nombre:string,descripcion:string,alcance:string,permisos:list<string>} $datos */
    public function actualizar(string $id, array $datos): void;

    public function eliminar(string $id): void;
}
