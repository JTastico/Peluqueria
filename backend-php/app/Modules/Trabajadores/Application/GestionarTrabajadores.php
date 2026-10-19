<?php

declare(strict_types=1);

namespace App\Modules\Trabajadores\Application;

use App\Core\Auth\AuthUser;
use App\Core\Exceptions\ApiException;
use App\Core\Support\Alcance;
use App\Modules\Locales\Domain\LocalRepository;
use App\Modules\Trabajadores\Domain\TrabajadorRepository;

/**
 * Los trabajadores no tienen cuenta: son registros a los que el dueño o la encargada les atribuye
 * servicios. Cada local lleva su propio historial del trabajador (se pausa al trasladarlo).
 */
final class GestionarTrabajadores
{
    public function __construct(private readonly TrabajadorRepository $trabajadores, private readonly LocalRepository $locales) {}

    public function listar(Alcance $alcance): array
    {
        return $this->trabajadores->listar($alcance);
    }

    public function crear(string $nombre, string $apellido, ?string $telefono, string $localId): array
    {
        $this->exigirLocal($localId);
        $id = $this->trabajadores->crear($nombre, $apellido, $telefono, $localId);
        return $this->trabajadores->ficha($id, $localId);
    }

    public function eliminar(string $id): void
    {
        if (! $this->trabajadores->eliminar($id)) {
            throw ApiException::noEncontrado('Trabajador no encontrado para eliminar.');
        }
    }

    /** El historial del local de origen queda EN PAUSA hasta que regrese; en el destino se abre el suyo. */
    public function trasladar(AuthUser $actor, string $id, string $destino, string $motivo): array
    {
        $trabajador = $this->trabajadores->buscar($id) ?? throw ApiException::noEncontrado('Trabajador no encontrado.');
        $this->exigirAcceso($actor, $destino);
        if ($trabajador['local_id'] === $destino) {
            throw ApiException::invalido('El trabajador ya está en ese local.');
        }
        if (! $this->locales->existe($destino)) {
            throw ApiException::invalido('El local de destino no existe.');
        }
        $this->trabajadores->trasladar($id, $trabajador['local_id'], $destino, $motivo, $actor->username);
        return $this->trabajadores->ficha($id, $destino);
    }

    /** Un trabajador que cubre dos locales: se agrega en otro local SIN pausar el actual. */
    public function agregarALocal(AuthUser $actor, string $id, string $localId): array
    {
        $this->exigirAcceso($actor, $localId);
        $this->trabajadores->buscar($id) ?? throw ApiException::noEncontrado('Trabajador no encontrado.');
        $this->exigirLocal($localId);
        $this->trabajadores->agregarALocal($id, $localId);
        return $this->trabajadores->ficha($id, $localId);
    }

    public function cambiarEstado(string $id, string $localId, string $estado): array
    {
        if (! $this->trabajadores->cambiarEstado($id, $localId, $estado)) {
            throw ApiException::noEncontrado('El trabajador no está asociado a ese local.');
        }
        return $this->trabajadores->ficha($id, $localId);
    }

    public function historial(AuthUser $actor, string $id): array
    {
        return $this->trabajadores->historial($id, $actor->alcanceLocales())
            ?? throw ApiException::noEncontrado('Trabajador no encontrado.');
    }

    /** Quien traslada o agrega a un local debe tener acceso a ese local de destino. */
    private function exigirAcceso(AuthUser $actor, string $localId): void
    {
        if (! $actor->puedeVerLocal($localId)) {
            throw ApiException::prohibido('No tienes acceso a ese local.');
        }
    }

    private function exigirLocal(string $localId): void
    {
        if (! $this->locales->existe($localId)) {
            throw ApiException::invalido('El local no existe.');
        }
    }
}
