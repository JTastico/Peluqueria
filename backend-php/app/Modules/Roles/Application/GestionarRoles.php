<?php

declare(strict_types=1);

namespace App\Modules\Roles\Application;

use App\Core\Exceptions\ApiException;
use App\Core\Permisos\Catalogo;
use App\Modules\Roles\Domain\IdRol;
use App\Modules\Roles\Domain\RolRepository;

/** Casos de uso de roles: listar, crear, actualizar y eliminar. */
final class GestionarRoles
{
    public function __construct(private readonly RolRepository $roles) {}

    public function listar(): array
    {
        return ['roles' => $this->roles->todos(), 'catalogo' => ['grupos' => Catalogo::GRUPOS, 'permisos' => Catalogo::PERMISOS]];
    }

    public function crear(array $datos): array
    {
        $id = IdRol::desdeNombre($datos['nombre']);
        if ($id === '') {
            throw ApiException::invalido('El nombre del rol no es válido.');
        }
        if ($this->roles->existe($id)) {
            throw ApiException::conflicto('Ya existe un rol con ese nombre.');
        }
        $this->roles->crear($id, $datos);
        return $this->roles->obtener($id) + ['usuarios' => 0];
    }

    public function actualizar(string $id, array $datos): array
    {
        if ($id === 'admin') {
            throw ApiException::prohibido('El rol de administrador no se puede modificar.');
        }
        if (! $this->roles->existe($id)) {
            throw ApiException::noEncontrado('Rol no encontrado.');
        }
        $this->roles->actualizar($id, $datos);
        return collect($this->roles->todos())->firstWhere('id', $id);
    }

    public function eliminar(string $id): void
    {
        if (! $this->roles->existe($id)) {
            throw ApiException::noEncontrado('Rol no encontrado.');
        }
        if ($this->roles->esDeSistema($id)) {
            throw ApiException::prohibido('Los roles base del sistema no se pueden eliminar.');
        }
        if (($n = $this->roles->contarUsuarios($id)) > 0) {
            throw ApiException::conflicto("Hay {$n} usuario(s) con este rol. Cámbiales el rol antes de eliminarlo.");
        }
        $this->roles->eliminar($id);
    }
}
