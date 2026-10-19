# API de Peluquería (Laravel · PHP)

Backend independiente del frontend (otro dominio), con **arquitectura hexagonal ligera**.

## La regla: cada módulo tiene 3 capas

| Capa | Pregunta que responde | Qué contiene | Depende de |
|---|---|---|---|
| `Domain/` | **¿Qué es?** | Reglas puras del negocio y el **puerto** (interfaz del repositorio) | nada |
| `Application/` | **¿Qué hace?** | Un **servicio** con los casos de uso del módulo | `Domain/` |
| `Infrastructure/` | **¿Con qué?** | Controlador, validaciones y repositorio Eloquent (los **adaptadores**) | `Application/` y `Domain/` |

Y una convención fija: **1 módulo = 1 servicio + 1 controlador + 1 repositorio**.
Si buscas algo de ventas, está en `Modules/Ventas`; si buscas *cómo se reparte* una venta, en `Ventas/Domain/Reparto.php`.

```
app/
├── Core/                       Lo compartido por todos los módulos (no depende de ninguno)
│   ├── Alcance.php             A qué locales llega un usuario → filtro SQL (un solo sitio)
│   ├── ApiException.php        Errores de negocio: 400, 401, 403, 404, 409
│   ├── AuthUser.php            El usuario de la petición: rol, permisos y locales
│   ├── Permisos.php            Catálogo de permisos y roles base
│   └── Http/                   ApiRequest (base de validaciones) y middlewares comunes
├── Models/                     Tablas de la base de datos (Eloquent)
├── Modules/
│   └── Ventas/                 ← todos los módulos tienen esta misma forma
│       ├── Domain/
│       │   ├── VentaRepository.php       puerto: qué necesita guardar/leer
│       │   └── Reparto.php               regla pura: trabajador / local
│       ├── Application/
│       │   └── VentasService.php         casos de uso: registrar, listar, anular
│       ├── Infrastructure/
│       │   ├── VentasController.php      entrada HTTP
│       │   ├── VentaRequest.php          validación de la entrada
│       │   └── EloquentVentaRepository.php  salida: implementa el puerto con MySQL
│       └── routes.php
└── Providers/AppServiceProvider.php   conecta cada puerto con su adaptador
```

| Módulo | Servicio | Qué hace |
|---|---|---|
| Auth | `AuthService` | Login, usuario de cada petición (JWT), contraseña y preferencias propias |
| Usuarios | `UsuariosService` | Listar usuarios y cambiarles el rol |
| Roles | `RolesService` | Roles y sus permisos |
| Locales | `LocalesService` | Locales con sus cifras del mes |
| Trabajadores | `TrabajadoresService` | Alta, baja, traslados e historial por local |
| Servicios | `ServiciosService` | Servicios, precios y porcentaje del trabajador |
| Productos | `ProductosService` | Inventario y ajustes de stock |
| Ventas | `VentasService` | Cobrar, listar y anular |
| Reportes | `ReportesService` | Dashboard, liquidación y detalle de un local |
| Configuracion | `ConfiguracionService` | Datos del negocio, tema y logo |

### Recorrido de una petición: cobrar una venta

```
POST /api/ventas
  → Ventas/routes.php                middlewares: auth.jwt (sesión) · permiso:ventas.registrar · local.body
  → VentaRequest                     valida la entrada (400 si algo no cuadra)
  → VentasController::store          solo traduce HTTP ⇄ servicio
  → VentasService::registrar         reglas: servicio del local, trabajador activo, Reparto
  → VentaRepository (puerto)         la aplicación no sabe que detrás hay MySQL
  → EloquentVentaRepository          guarda venta + servicios en una transacción
```

### Dependencias permitidas
- `Infrastructure → Application → Domain`, nunca al revés.
- Un módulo puede usar el **puerto** (`Domain/`) de otro módulo, nunca su `Infrastructure/`.
  Ej.: `VentasService` usa `ServicioRepository` y `TrabajadorRepository`.
- `Core/` lo puede usar cualquiera; `Core/` no usa ningún módulo.

### Caché sin tocar la lógica
Roles, lista de locales y configuración se leen en cada petición y casi nunca cambian. Su adaptador
va envuelto en un **decorador** (`CachedRolRepository`, `CachedLocalRepository`,
`CachedConfiguracionRepository`) que guarda la lectura y la invalida al escribir. El servicio no se entera.

### Agregar un módulo nuevo (receta)
1. `Modules/Citas/Domain/CitaRepository.php`: la interfaz con lo que necesitas.
2. `Modules/Citas/Application/CitasService.php`: los casos de uso, recibiendo el puerto por constructor.
3. `Modules/Citas/Infrastructure/`: `EloquentCitaRepository`, `CitasController` y sus `*Request`.
4. `Modules/Citas/routes.php` y añadir `'Citas'` a la lista de `routes/api.php`.
5. En `AppServiceProvider::ADAPTADORES`: `CitaRepository::class => EloquentCitaRepository::class`.

## Seguridad
- JWT HS256 con expiración; el usuario, su rol y permisos se vuelven a leer en cada petición (un usuario borrado o con otro rol surte efecto al instante).
- Permisos por rol + alcance por local en cada ruta; los registros de otros locales responden 404/403.
- Sin contraseñas por defecto: el administrador inicial usa `ADMIN_PASSWORD` o una contraseña aleatoria que se imprime una sola vez.
- Límite de login (8 intentos/15 min por IP+usuario), límite general por IP, cuerpos máx. 100 KB (logo 1 MB), cabeceras de seguridad, CORS solo para `FRONTEND_ORIGIN`.
- Validación de entrada en todas las rutas (`FormRequest`), consultas parametrizadas (Eloquent), `$fillable` en los modelos, logo validado por contenido real.
- Errores 5xx sin detalles internos; con `APP_DEBUG=false` nunca se filtran trazas.

## Rendimiento
- Índices en `database/migrations/..._agregar_indices.php` (ventas por local/fecha/estado, items, historial…).
- Filtros de fecha por rango (`fecha_hora >= ? AND < ?`), sin `DATE()` → usan el índice.
- Caché (rol+permisos, lista de locales, configuración/tema) que se invalida al escribir. `/api/marca` (pública) no consulta la base cuando la caché está caliente.
- Sin consultas N+1: ventas, trabajadores, reparto y reportes cargan por lotes o con un único JOIN agregado. Dashboard: 6 consultas.

## Desarrollo
```bash
composer install
cp .env.example .env && php artisan key:generate    # edita DB_* y JWT_SECRET
php artisan migrate --seed                           # SEED_DEMO=true añade datos de ejemplo
php artisan serve                                    # http://localhost:8000/api/health
php artisan test
```
Requiere PHP ≥ 8.3 con `pdo_mysql`, `mbstring`, `openssl`, `fileinfo`, `gd` o `exif` (para validar el logo, `getimagesizefromstring`).

## Subir al hosting (solo PHP, sin instalar nada)
Front y API en dominios distintos, p. ej. `app.tudominio.com` y `api.tudominio.com`.

1. **En tu PC**: `composer install --no-dev --optimize-autoloader` (genera `vendor/`).
2. **Base de datos**: crea la base y el usuario en el panel (MySQL). Importa `database/instalar.sql` desde phpMyAdmin (tablas, índices, roles y configuración).
3. **Sube** la carpeta `backend-php/` completa (incluida `vendor/`) por FTP **fuera** de `public_html`, y haz que el subdominio `api.` apunte a `backend-php/public`. Si no puedes cambiar la raíz, sube el contenido de `public/` a la raíz del subdominio y ajusta las rutas de `index.php` a `../backend-php/...`.
4. **`.env` en el servidor** (copia `.env.example`): `APP_ENV=production`, `APP_DEBUG=false`, `APP_KEY` (`php artisan key:generate --show` en tu PC), `DB_*`, `JWT_SECRET` (`php -r "echo bin2hex(random_bytes(48));"`), `FRONTEND_ORIGIN=https://app.tudominio.com`, `ADMIN_PASSWORD` (≥12 caracteres). Permisos `600` y nunca dentro de la carpeta pública.
5. **Administrador inicial** (una vez): en cPanel → *Cron Jobs* ejecuta `php /ruta/backend-php/artisan db:seed --class=AdministradorSeeder --force` o, si tienes Terminal/SSH, el mismo comando.
6. Opcional (más rápido): `php artisan config:cache route:cache` tras cada cambio de `.env`.
7. HTTPS activo (AutoSSL) en ambos dominios. Permisos de escritura para `storage/` y `bootstrap/cache/`.
8. **Front**: `VITE_API_URL=https://api.tudominio.com/api npm run build` y sube `dist/` al dominio `app.`.

Comprobación: `https://api.tudominio.com/api/health` → `{"status":"ok"}`.
