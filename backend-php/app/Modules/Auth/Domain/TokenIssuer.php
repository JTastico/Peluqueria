<?php

declare(strict_types=1);

namespace App\Modules\Auth\Domain;

/** Puerto: emite y lee los tokens de sesión. Hoy es JWT; cambiarlo no toca los casos de uso. */
interface TokenIssuer
{
    public function emitir(string $userId, string $role): string;

    /**
     * Devuelve el id del usuario dueño del token.
     *
     * @throws \App\Core\ApiException 401 si el token es inválido o expiró
     */
    public function usuarioDe(string $token): string;
}
