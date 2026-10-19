<?php

declare(strict_types=1);

namespace App\Modules\Usuarios\Domain;

/** Puerto de administración de usuarios (lo usa el dueño). */
interface UsuarioAdminRepository
{
    public function listar(): array;

    /** @return array{id:string,role:string}|null */
    public function buscar(string $id): ?array;

    public function contarConRol(string $rolId): int;

    /** Cambia el rol y reemplaza los locales asignados, de forma atómica. */
    public function asignarRol(string $id, string $rolId, array $localesIds): void;
}
