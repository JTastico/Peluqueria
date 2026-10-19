<?php

declare(strict_types=1);

namespace App\Modules\Usuarios\Domain;

use App\Models\User;

/** Puerto de persistencia de las cuentas de usuario. */
interface UsuarioRepository
{
    public function porId(string $id): ?User;

    public function porUsername(string $username): ?User;

    /** Ids de los locales asignados a un rol de alcance "multi". @return list<string> */
    public function localesAsignados(string $id): array;

    public function cambiarPassword(User $usuario, string $nueva): void;

    public function guardarPreferencias(string $id, string $fuente, string $tamano): void;

    /** Todos los usuarios con su rol, local y locales asignados (para el administrador). */
    public function listar(): array;

    public function contarConRol(string $rolId): int;

    /** Cambia el rol y reemplaza los locales asignados, de forma atómica. */
    public function asignarRol(string $id, string $rolId, array $localesIds): void;
}
