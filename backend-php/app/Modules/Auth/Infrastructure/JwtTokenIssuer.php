<?php

declare(strict_types=1);

namespace App\Modules\Auth\Infrastructure;

use App\Modules\Auth\Domain\TokenIssuer;
use App\Core\ApiException;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Throwable;

final class JwtTokenIssuer implements TokenIssuer
{
    private const ALGORITMO = 'HS256';

    public function __construct(private readonly string $secreto, private readonly int $minutos)
    {
        // Sin secreto válido no se arranca (evita tokens firmables por terceros)
        if (strlen($secreto) < 32) {
            throw new \RuntimeException('JWT_SECRET no está definido o tiene menos de 32 caracteres.');
        }
    }

    public function emitir(string $userId, string $role): string
    {
        $ahora = time();
        return JWT::encode(
            ['sub' => $userId, 'role' => $role, 'iat' => $ahora, 'exp' => $ahora + $this->minutos * 60],
            $this->secreto,
            self::ALGORITMO
        );
    }

    public function usuarioDe(string $token): string
    {
        try {
            $payload = JWT::decode($token, new Key($this->secreto, self::ALGORITMO));
        } catch (ExpiredException) {
            throw ApiException::noAutenticado('La sesión expiró.');
        } catch (Throwable) {
            throw ApiException::noAutenticado('Sesión inválida.');
        }
        if (! is_string($payload->sub ?? null)) {
            throw ApiException::noAutenticado('Sesión inválida.');
        }
        return $payload->sub;
    }
}
