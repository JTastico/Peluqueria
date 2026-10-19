<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([RolesSeeder::class, ConfiguracionSeeder::class, AdministradorSeeder::class]);

        // Datos de ejemplo solo si se pide expresamente y nunca en producción
        if (config('seguridad.seed_demo') && ! app()->isProduction()) {
            $this->call(DemoSeeder::class);
        }
    }
}
