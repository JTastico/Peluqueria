<?php

declare(strict_types=1);

namespace App\Core\Support;

use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Query\Builder as QueryBuilder;

/**
 * A qué locales llega un usuario: todos, o una lista de ids.
 * Es el único sitio que sabe traducir ese alcance a SQL (evita repetir el filtro en cada consulta).
 */
final class Alcance
{
    /** @param list<string>|null $ids null = todos los locales */
    private function __construct(private readonly ?array $ids) {}

    public static function todos(): self
    {
        return new self(null);
    }

    /** @param list<string> $ids */
    public static function de(array $ids): self
    {
        return new self(array_values(array_unique($ids)));
    }

    public function esTodos(): bool
    {
        return $this->ids === null;
    }

    /** @return list<string>|null */
    public function ids(): ?array
    {
        return $this->ids;
    }

    public function incluye(string $localId): bool
    {
        return $this->ids === null || in_array($localId, $this->ids, true);
    }

    /** Si el alcance es un único local lo devuelve (para reflejarlo en las respuestas). */
    public function unico(): ?string
    {
        return $this->ids !== null && count($this->ids) === 1 ? $this->ids[0] : null;
    }

    public function aplicar(EloquentBuilder|QueryBuilder $consulta, string $columna): EloquentBuilder|QueryBuilder
    {
        if ($this->ids === null) {
            return $consulta;
        }
        return $this->ids === [] ? $consulta->whereRaw('0 = 1') : $consulta->whereIn($columna, $this->ids);
    }
}
