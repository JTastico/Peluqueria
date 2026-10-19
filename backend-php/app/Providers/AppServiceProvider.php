<?php

declare(strict_types=1);

namespace App\Providers;

use App\Modules\Auth\Domain\TokenIssuer;
use App\Modules\Auth\Infrastructure\JwtTokenIssuer;
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
use App\Modules\Usuarios\Domain\UsuarioRepository;
use App\Modules\Usuarios\Infrastructure\EloquentUsuarioRepository;
use App\Modules\Ventas\Domain\VentaRepository;
use App\Modules\Ventas\Infrastructure\EloquentVentaRepository;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

/**
 * Aquí se conecta cada PUERTO (interfaz del dominio) con su ADAPTADOR (implementación).
 * Es el único sitio que sabe que se usa Eloquent, JWT o caché: para cambiar una tecnología
 * solo se toca esta lista.
 */
class AppServiceProvider extends ServiceProvider
{
    /** Puerto => adaptador, sin caché. */
    private const ADAPTADORES = [
        UsuarioRepository::class => EloquentUsuarioRepository::class,
        TrabajadorRepository::class => EloquentTrabajadorRepository::class,
        ServicioRepository::class => EloquentServicioRepository::class,
        ProductoRepository::class => EloquentProductoRepository::class,
        VentaRepository::class => EloquentVentaRepository::class,
        ReporteRepository::class => EloquentReporteRepository::class,
    ];

    /** Puerto => [adaptador, decorador con caché]: datos que se leen mucho y cambian poco. */
    private const CON_CACHE = [
        RolRepository::class => [EloquentRolRepository::class, CachedRolRepository::class],
        LocalRepository::class => [EloquentLocalRepository::class, CachedLocalRepository::class],
        ConfiguracionRepository::class => [EloquentConfiguracionRepository::class, CachedConfiguracionRepository::class],
    ];

    public function register(): void
    {
        foreach (self::ADAPTADORES as $puerto => $adaptador) {
            $this->app->bind($puerto, $adaptador);
        }
        foreach (self::CON_CACHE as $puerto => [$adaptador, $decorador]) {
            $this->app->singleton($puerto, fn ($app) => new $decorador($app->make($adaptador), $app->make('cache.store')));
        }
        $this->app->singleton(TokenIssuer::class, fn () => new JwtTokenIssuer((string) config('jwt.secret'), (int) config('jwt.minutes')));
    }

    public function boot(): void
    {
        // Ids de ruta: siempre UUID (los roles lo sobrescriben con su propio patrón)
        Route::pattern('id', '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}');

        // Límite general por IP y uno más estricto para el login (por IP + usuario)
        RateLimiter::for('api', fn (Request $r) => Limit::perMinute((int) config('seguridad.rate_limit'))->by($r->ip()));
        RateLimiter::for('login', fn (Request $r) => Limit::perMinutes(15, 8)->by(strtolower((string) $r->input('username')).'|'.$r->ip()));
    }
}
