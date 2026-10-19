<?php

declare(strict_types=1);

namespace App\Core\Contracts;

/** Puerto de lectura de locales que necesita el núcleo para calcular el alcance del usuario. */
interface ConsultaLocales
{
    /** @return list<array{id:string,nombre:string,type:string}> */
    public function todos(): array;

    /** @return list<array{id:string,nombre:string,type:string}> */
    public function porIds(array $ids): array;
}
