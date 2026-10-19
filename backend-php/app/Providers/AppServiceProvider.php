<?php

declare(strict_types=1);

namespace App\Providers;

use App\Core\Auth\JwtTokenIssuer;
use App\Core\Contracts\ConsultaLocales;
use App\Core\Contracts\ConsultaRoles;
use App\Core\Contracts\TokenIssuer;
use App\Modules\Auth\Domain\UsuarioRepository;
use App\Modules\Auth\Infrastructure\EloquentUsuarioRepository;
use App\Modules\Configuracion\Domain\ConfiguracionRepository;
use App\Modules\Configuracion\Infrastructure\CachedConfiguracionRepository;
use App\Modules\Configuracion\Infrastructure\EloquentConfiguracionRepository;
use App\Modules\Locales\Domain\LocalRepository;
use App\Modules\Locales\Infrastructure\CachedLocalRepository;
use App\Modules\Locales\Infrastructure\EloquentLocalRepository;
use App\Modules\Productos\Domain\ProductoRepository;
use App\Modules\Productos\Infrastructure\EloquentProductoRepository;
use App\Modules\Reportes\Domain\ReporteRepository;
use App\Modules\Reportes\Infrastructure\EloquentReporteRepository;
use App\Modules\Roles\Domain\RolRepository;
use App\Modules\Roles\Infrastructure\CachedRolRepository;
use App\Modules\Roles\Infrastructure\EloquentRolRepository;
use App\Modules\Servicios\Domain\ServicioRepository;
use App\Modules\Servicios\Infrastructure\EloquentServicioRepository;
use App\Modules\Trabajadores\Domain\TrabajadorRepository;
use App\Modules\Trabajadores\Infrastructure\EloquentTrabajadorRepository;
use App\Modules\Usuarios\Domain\UsuarioAdminRepository;
use App\Modules\Usuarios\Infrastructure\EloquentUsuarioAdminRepository;
use App\Modules\Ventas\Domain\VentaRepository;
use App\Modules\Ventas\Infrastructure\EloquentVentaRepository;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

/**
 * Raíz de composición: aquí se decide qué adaptador (infraestructura) usa cada puerto (dominio).
 * Para cambiar de base de datos, de caché o de tipo de token solo se toca este archivo.
 */
class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(TokenIssuer::class, fn () => new JwtTokenIssuer((string) config('jwt.secret'), (int) config('jwt.minutes')));

        // Puertos con caché: el adaptador Eloquent va envuelto en su decorador
        $this->app->singleton(RolRepository::class, fn ($app) => new CachedRolRepository($app->make(EloquentRolRepository::class), $app->make('cache.store')));
        $this->app->singleton(LocalRepository::class, fn ($app) => new CachedLocalRepository($app->make(EloquentLocalRepository::class), $app->make('cache.store')));
        $this->app->singleton(ConfiguracionRepository::class, fn ($app) => new CachedConfiguracionRepository($app->make(EloquentConfiguracionRepository::class), $app->make('cache.store')));
        // El núcleo solo conoce los puertos de lectura
        $this->app->bind(ConsultaRoles::class, RolRepository::class);
        $this->app->bind(ConsultaLocales::class, LocalRepository::class);

        foreach ([
            UsuarioRepository::class => EloquentUsuarioRepository::class,
            UsuarioAdminRepository::class => EloquentUsuarioAdminRepository::class,
            ServicioRepository::class => EloquentServicioRepository::class,
            ProductoRepository::class => EloquentProductoRepository::class,
            TrabajadorRepository::class => EloquentTrabajadorRepository::class,
            VentaRepository::class => EloquentVentaRepository::class,
            ReporteRepository::class => EloquentReporteRepository::class,
        ] as $puerto => $adaptador) {
            $this->app->bind($puerto, $adaptador);
        }
    }

    public function boot(): void
    {
        // Ids de ruta: siempre UUID (los roles lo sobrescriben con su propio patrón)
        Route::pattern('id', '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}');

        // Límite general por IP y límite más estricto para el login (por IP + usuario)
        RateLimiter::for('api', fn (Request $r) => Limit::perMinute((int) config('seguridad.rate_limit'))->by($r->ip()));
        RateLimiter::for('login', fn (Request $r) => Limit::perMinutes(15, 8)->by(strtolower((string) $r->input('username')).'|'.$r->ip()));
    }
}
