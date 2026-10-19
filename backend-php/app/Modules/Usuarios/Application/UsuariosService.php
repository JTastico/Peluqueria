<?php

declare(strict_types=1);

namespace App\Modules\Usuarios\Application;

use App\Core\ApiException;
use App\Modules\Locales\Domain\LocalRepository;
use App\Modules\Roles\Domain\RolRepository;
use App\Modules\Usuarios\Domain\UsuarioRepository;

final class UsuariosService
{
    public function __construct(
        private readonly UsuarioRepository $usuarios,
        private readonly RolRepository $roles,
        private readonly LocalRepository $locales,
    ) {}

    public function listar(): array
    {
        return $this->usuarios->listar();
    }

    /** Cambia el rol de un usuario y, si el rol es de varios locales, los locales a los que puede ingresar. */
    public function cambiarRol(string $actorId, string $id, string $rolId, array $locales): array
    {
        if ($id === $actorId) {
            throw ApiException::prohibido('No puedes cambiar tu propio rol.');
        }
        $usuario = $this->usuarios->porId($id) ?? throw ApiException::noEncontrado('Usuario no encontrado.');
        $rol = $this->roles->obtener($rolId) ?? throw ApiException::invalido('El rol indicado no existe.');

        // Siempre debe quedar al menos un administrador
        if ($usuario->role === 'admin' && $rolId !== 'admin' && $this->usuarios->contarConRol('admin') <= 1) {
            throw ApiException::conflicto('Debe quedar al menos un administrador.');
        }

        $asignados = [];
        if ($rol['alcance'] === 'multi') {
            $asignados = array_values(array_unique($locales));
            if ($asignados === []) {
                throw ApiException::invalido('Elige al menos un local para este rol.');
            }
            if (! $this->locales->existenTodos($asignados)) {
                throw ApiException::invalido('Algún local indicado no existe.');
            }
        }
        $this->usuarios->asignarRol($id, $rolId, $asignados);

        return ['id' => $id, 'rol' => $rolId, 'locales_asignados' => $asignados];
    }
}
