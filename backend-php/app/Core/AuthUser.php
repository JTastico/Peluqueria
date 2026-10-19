<?php

declare(strict_types=1);

namespace App\Core;


/** El usuario autenticado de la petición, con su rol, permisos y locales a los que llega. */
final class AuthUser
{
    /**
     * @param list<string> $permisos
     * @param list<array{id:string,nombre:string,type:string}> $locales
     * @param array{fuente:string,tamano:string} $preferencias
     */
    public function __construct(
        public readonly string $id,
        public readonly string $username,
        public readonly string $role,
        public readonly string $rolNombre,
        public readonly string $alcance,
        public readonly ?string $localId,
        public readonly ?string $trabajadorId,
        public readonly array $permisos,
        public readonly array $locales,
        public readonly array $preferencias,
    ) {}

    /** Pasa si tiene al menos uno de los permisos indicados. */
    public function puede(string ...$permisos): bool
    {
        return array_intersect($permisos, $this->permisos) !== [];
    }

    public function esGlobal(): bool
    {
        return $this->alcance === 'global';
    }

    public function alcanceLocales(): Alcance
    {
        return $this->esGlobal() ? Alcance::todos() : Alcance::de(array_column($this->locales, 'id'));
    }

    public function puedeVerLocal(string $localId): bool
    {
        return $this->alcanceLocales()->incluye($localId);
    }

    /** Lo que el frontend necesita para dibujar la interfaz (el backend valida cada petición). */
    public function publico(): array
    {
        return [
            'id' => $this->id,
            'username' => $this->username,
            'role' => $this->role,
            'rol_nombre' => $this->rolNombre,
            'alcance' => $this->alcance,
            'local_id' => $this->localId,
            'trabajador_id' => $this->trabajadorId,
            'permisos' => $this->permisos,
            'locales' => $this->locales,
            'preferencias' => $this->preferencias,
        ];
    }
}
