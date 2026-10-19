<?php

declare(strict_types=1);

namespace App\Core\Contracts;

/** Puerto: emite y valida los tokens de sesión (hoy JWT; podría cambiarse sin tocar los casos de uso). */
interface TokenIssuer
{
    public function emitir(string $userId, string $role): string;

    /** @return string|null id del usuario, o null si el token es inválido o expiró */
    public function validar(string $token): ?string;

    /** @throws \App\Core\Exceptions\ApiException 401 con el motivo (expirado / inválido) */
    public function usuarioDe(string $token): string;
}
