<?php

declare(strict_types=1);

namespace App\Modules\Auth\Application;

use App\Core\ApiException;
use App\Core\AuthUser;
use App\Models\User;
use App\Modules\Auth\Domain\TokenIssuer;
use App\Modules\Locales\Domain\LocalRepository;
use App\Modules\Roles\Domain\RolRepository;
use App\Modules\Usuarios\Domain\Preferencias;
use App\Modules\Usuarios\Domain\UsuarioRepository;
use Illuminate\Contracts\Hashing\Hasher;

/** Sesión: iniciar sesión, reconocer al usuario de cada petición y mantener la propia cuenta. */
final class AuthService
{
    /** Hash ficticio para que el tiempo de respuesta no revele si el usuario existe. */
    private const HASH_FALSO = '$2y$12$PT9gjKjODXeJM9U8gCcMcOXwO.fZulAJHpEvRdCiE5i/KzFSouZKq';

    public function __construct(
        private readonly UsuarioRepository $usuarios,
        private readonly RolRepository $roles,
        private readonly LocalRepository $locales,
        private readonly TokenIssuer $tokens,
        private readonly Hasher $hasher,
    ) {}

    public function login(string $username, string $password): array
    {
        $usuario = $this->usuarios->porUsername($username);
        $valido = $this->hasher->check($password, $usuario?->password ?? self::HASH_FALSO);

        if (! $usuario || ! $valido) {
            throw ApiException::noAutenticado('Credenciales inválidas.');
        }
        return [
            'message' => 'Login exitoso',
            'token' => $this->tokens->emitir($usuario->id, $usuario->role),
            'user' => $this->armar($usuario)->publico(),
        ];
    }

    /**
     * El usuario de la petición. Se lee de la base cada vez: si lo borran o le cambian el rol,
     * surte efecto de inmediato. El rol y los locales vienen de la caché.
     */
    public function autenticar(string $token): AuthUser
    {
        $usuario = $this->usuarios->porId($this->tokens->usuarioDe($token))
            ?? throw ApiException::noAutenticado('El usuario ya no existe.');
        return $this->armar($usuario);
    }

    public function cambiarPassword(AuthUser $actual, string $contrasenaActual, string $nueva): void
    {
        if ($nueva === $contrasenaActual || $nueva === $actual->username) {
            throw ApiException::invalido('La nueva contraseña debe ser distinta a la actual y al usuario.');
        }
        $usuario = $this->usuarios->porId($actual->id);
        if (! $usuario || ! $this->hasher->check($contrasenaActual, $usuario->password)) {
            throw ApiException::noAutenticado('La contraseña actual no es correcta.');
        }
        $this->usuarios->cambiarPassword($usuario, $nueva);
    }

    public function guardarPreferencias(AuthUser $actual, string $fuente, string $tamano): array
    {
        $this->usuarios->guardarPreferencias($actual->id, $fuente, $tamano);
        return ['preferencias' => ['fuente' => $fuente, 'tamano' => $tamano]];
    }

    private function armar(User $u): AuthUser
    {
        $rol = $this->roles->obtener($u->role);
        $alcance = $rol['alcance'] ?? 'local';   // un rol inexistente no concede nada

        return new AuthUser(
            id: $u->id,
            username: $u->username,
            role: $u->role,
            rolNombre: $rol['nombre'] ?? $u->role,
            alcance: $alcance,
            localId: $u->local_id,
            trabajadorId: $u->trabajador_id,
            permisos: $rol['permisos'] ?? [],
            locales: $this->localesDe($u, $alcance),
            preferencias: Preferencias::normalizar($u->pref_fuente, $u->pref_tamano),
        );
    }

    /** global = todos · multi = los asignados (+ el suyo) · local = solo el suyo */
    private function localesDe(User $u, string $alcance): array
    {
        if ($alcance === 'global') {
            return $this->locales->todos();
        }
        $ids = $alcance === 'multi' ? $this->usuarios->localesAsignados($u->id) : [];
        if ($u->local_id) {
            $ids[] = $u->local_id;
        }
        return $this->locales->porIds($ids);
    }
}
