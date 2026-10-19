# API de Peluquería (Laravel · PHP)

Backend independiente del frontend (otro dominio). Arquitectura **hexagonal ligera**: cada módulo
tiene solo tres carpetas y las dependencias apuntan siempre hacia el dominio.

```
app/
├── Core/                       Lo compartido por todos los módulos
│   ├── Auth/                   AuthUser, CargadorUsuario, JwtTokenIssuer
│   ├── Contracts/              Puertos del núcleo (TokenIssuer, ConsultaRoles, ConsultaLocales)
│   ├── Exceptions/ApiException Errores de negocio con su código HTTP
│   ├── Http/                   Middlewares (JWT, permisos, alcance por local, límites) y ApiRequest
│   ├── Permisos/Catalogo       Catálogo de permisos y roles base
│   └── Support/Alcance         "A qué locales llega el usuario" → SQL (un solo sitio)
├── Models/                     Modelos Eloquent (adaptadores de persistencia)
├── Modules/<Modulo>/
│   ├── Domain/                 Reglas puras y PUERTOS (interfaces de repositorio)
│   ├── Application/            Casos de uso: orquestan el dominio, sin HTTP ni SQL
│   ├── Infrastructure/         Adaptadores: repositorio Eloquent, controladores, validaciones
│   └── routes.php              Rutas del módulo
└── Providers/AppServiceProvider  Raíz de composición: puerto → adaptador (y decoradores de caché)
```

Módulos: Auth, Marca, Locales, Trabajadores, Servicios, Productos, Ventas, Reportes, Configuracion, Roles, Usuarios.

**Por qué es SOLID y sin código repetido**
- Cada caso de uso depende de interfaces (`VentaRepository`, `TokenIssuer`…), no de Eloquent → se puede cambiar la persistencia sin tocar la lógica.
- El filtro "solo mis locales" vive en `Core/Support/Alcance`; los permisos en `Core/Http/Middleware/RequirePermiso`; la validación en `ApiRequest`. Ninguna consulta ni controlador lo repite.
- La caché son **decoradores** (`CachedRolRepository`, `CachedLocalRepository`, `CachedConfiguracionRepository`): añaden caché sin modificar el repositorio (abierto/cerrado).

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
