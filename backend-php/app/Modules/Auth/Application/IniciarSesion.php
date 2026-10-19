<?php

declare(strict_types=1);

namespace App\Modules\Auth\Application;

use App\Core\Auth\CargadorUsuario;
use App\Core\Contracts\TokenIssuer;
use App\Core\Exceptions\ApiException;
use App\Modules\Auth\Domain\UsuarioRepository;
use Illuminate\Contracts\Hashing\Hasher;

final class IniciarSesion
{
    /** Hash ficticio para que el tiempo de respuesta no revele si el usuario existe. */
    private const HASH_FALSO = '$2y$12$PT9gjKjODXeJM9U8gCcMcOXwO.fZulAJHpEvRdCiE5i/KzFSouZKq';

    public function __construct(
        private readonly UsuarioRepository $usuarios,
        private readonly Hasher $hasher,
        private readonly TokenIssuer $tokens,
        private readonly CargadorUsuario $cargador,
    ) {}

    public function __invoke(string $username, string $password): array
    {
        $usuario = $this->usuarios->porUsername($username);
        $valido = $this->hasher->check($password, $usuario?->password ?? self::HASH_FALSO);

        if (! $usuario || ! $valido) {
            throw ApiException::noAutenticado('Credenciales inválidas.');
        }
        return [
            'message' => 'Login exitoso',
            'token' => $this->tokens->emitir($usuario->id, $usuario->role),
            'user' => $this->cargador->armar($usuario)->publico(),
        ];
    }
}
