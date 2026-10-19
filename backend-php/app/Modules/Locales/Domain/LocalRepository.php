<?php

declare(strict_types=1);

namespace App\Modules\Locales\Domain;

use App\Core\Alcance;

/** Puerto de persistencia de locales. */
interface LocalRepository
{
    /** Lista corta (id, nombre, tipo) de todos los locales. @return list<array{id:string,nombre:string,type:string}> */
    public function todos(): array;

    /** @param list<string> $ids @return list<array{id:string,nombre:string,type:string}> */
    public function porIds(array $ids): array;

    /** Locales con sus cifras del mes en curso, acotados al alcance. */
    public function resumenes(Alcance $alcance): array;

    public function resumen(string $id): ?array;

    public function existe(string $id): bool;

    /** @param list<string> $ids  true si todos existen */
    public function existenTodos(array $ids): bool;

    /** Crea el local y su usuario encargado en una sola transacción. Devuelve el id. */
    public function crearConEncargado(array $local, string $username, string $passwordHash): string;

    public function eliminar(string $id): bool;
}
