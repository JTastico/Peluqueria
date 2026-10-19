<?php

declare(strict_types=1);

namespace App\Modules\Trabajadores\Domain;

use App\Core\Support\Alcance;

/** Puerto de persistencia de trabajadores y su historial por local. */
interface TrabajadorRepository
{
    /** Una fila por (trabajador, local donde trabaja o trabajó), con las cifras del mes de ESE local. */
    public function listar(Alcance $alcance): array;

    public function ficha(string $id, string $localId): ?array;

    /** @return array{id:string,nombre:string,apellido:string,local_id:string}|null */
    public function buscar(string $id): ?array;

    public function crear(string $nombre, string $apellido, ?string $telefono, string $localId): string;

    public function eliminar(string $id): bool;

    /** Pausa el historial del origen, abre/reanuda el del destino y registra el movimiento (atómico). */
    public function trasladar(string $id, string $origen, string $destino, string $motivo, string $usuario): void;

    /** Abre (o reanuda) al trabajador en otro local SIN pausar el actual. */
    public function agregarALocal(string $id, string $localId): void;

    public function cambiarEstado(string $id, string $localId, string $estado): bool;

    /** @return array{trabajador:array,locales:array,movimientos:array}|null */
    public function historial(string $id, Alcance $alcance): ?array;

    /** Trabajadores activos en un local. @param list<string> $ids @return array<string,string> id => nombre completo */
    public function activosEnLocal(array $ids, string $localId): array;
}
