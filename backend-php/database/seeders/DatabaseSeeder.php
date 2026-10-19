<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Los seeders escriben directo en la base: se vacía la caché para no servir roles/locales viejos
        Cache::flush();

        $this->call([RolesSeeder::class, ConfiguracionSeeder::class, AdministradorSeeder::class]);

        // Datos de ejemplo solo si se pide expresamente y nunca en producción
        if (config('seguridad.seed_demo') && ! app()->isProduction()) {
            $this->call(DemoSeeder::class);
        }
    }
}
