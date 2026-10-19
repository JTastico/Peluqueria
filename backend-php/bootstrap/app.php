<?php

use App\Core\ApiException;
use App\Modules\Auth\Infrastructure\Autenticar;
use App\Core\Http\Middleware\ConfiarEnProxies;
use App\Core\Http\Middleware\EnforceBodyLocal;
use App\Core\Http\Middleware\LimitarTamano;
use App\Core\Http\Middleware\OwnsLocalParam;
use App\Core\Http\Middleware\OwnsRecord;
use App\Core\Http\Middleware\RequirePermiso;
use App\Core\Http\Middleware\ResolveLocalScope;
use App\Core\Http\Middleware\SecurityHeaders;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        apiPrefix: 'api',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->append(SecurityHeaders::class);
        $middleware->prepend([ConfiarEnProxies::class, LimitarTamano::class]);
        $middleware->alias([
            'auth.jwt' => Autenticar::class,
            'permiso' => RequirePermiso::class,
            'alcance' => ResolveLocalScope::class,
            'local.body' => EnforceBodyLocal::class,
            'owns' => OwnsRecord::class,
            'owns.local' => OwnsLocalParam::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(fn (Request $request) => true);

        // Los errores de negocio viajan como { message } con su código HTTP
        $exceptions->render(fn (ApiException $e) => response()->json(['message' => $e->getMessage()], $e->status));
        $exceptions->render(fn (UniqueConstraintViolationException $e) => response()->json(['message' => 'Ya existe un registro con esos datos (usuario repetido).'], 409));
        $exceptions->render(fn (ModelNotFoundException $e) => response()->json(['message' => 'Registro no encontrado.'], 404));
        $exceptions->render(function (HttpExceptionInterface $e) {
            $mensajes = [404 => 'Ruta no encontrada.', 405 => 'Método no permitido.', 429 => 'Demasiadas peticiones. Espera un momento.'];
            return response()->json(['message' => $mensajes[$e->getStatusCode()] ?? 'Error.'], $e->getStatusCode(), $e->getHeaders());
        });
        // Nunca se filtran detalles internos en los errores 5xx
        $exceptions->render(function (Throwable $e) {
            if (config('app.debug')) {
                return null;
            }
            return response()->json(['message' => 'Error interno del servidor'], 500);
        });
    })->create();
