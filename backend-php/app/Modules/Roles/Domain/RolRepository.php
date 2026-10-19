<?php

declare(strict_types=1);

namespace App\Modules\Roles\Domain;

/** Puerto de persistencia de roles y sus permisos. */
interface RolRepository
{
    /** Rol con sus permisos (lo usa cada petición autenticada). @return array{id:string,nombre:string,alcance:string,permisos:list<string>}|null */
    public function obtener(string $rolId): ?array;

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
