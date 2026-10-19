<?php

namespace Database\Seeders;

use App\Models\Local;
use App\Models\Producto;
use App\Models\Servicio;
use App\Models\Trabajador;
use App\Models\TrabajadorLocal;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/** Datos de ejemplo para desarrollo (SEED_DEMO=true). Nunca se ejecuta en producción. */
class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $locales = [
            ['type' => 'barberia', 'nombre' => 'Barbería Koko', 'username' => 'barberia', 'direccion' => 'Av. Principal 123', 'horario' => 'Lun-Sab 9:00-20:00',
                'servicios' => [['Corte clásico', 25, 50], ['Afeitado con toalla caliente', 20, 50], ['Diseño de barba', 18, 50]],
                'trabajadores' => ['Carlos Mendoza', 'Roberto Silva'], 'productos' => [['Cera modeladora', 18, 6, 120], ['Aceite para barba', 3, 5, 95]]],
            ['type' => 'peluqueria', 'nombre' => 'Peluquería Koko', 'username' => 'peluqueria', 'direccion' => 'Blvd. Norte 456', 'horario' => 'Lun-Dom 8:00-21:00',
                'servicios' => [['Corte femenino', 35, 50], ['Coloración balayage', 120, 40], ['Peinado de fiesta', 50, 50]],
                'trabajadores' => ['María González', 'Laura Jiménez'], 'productos' => [['Shampoo profesional', 38, 10, 180], ['Tinte castaño', 15, 8, 350]]],
            ['type' => 'spa', 'nombre' => 'Spa Koko', 'username' => 'spa', 'direccion' => 'Col. Sur 789', 'horario' => 'Lun-Sab 10:00-19:00',
                'servicios' => [['Masaje relajante', 60, 40], ['Limpieza facial', 45, 40], ['Manicura y pedicura', 30, 50]],
                'trabajadores' => ['Ana Rodríguez', 'Lucía Paredes'], 'productos' => [['Aceite de masaje', 22, 5, 85], ['Crema facial', 6, 4, 140]]],
        ];

        foreach ($locales as $d) {
            $local = Local::query()->create(['type' => $d['type'], 'nombre' => $d['nombre'], 'direccion' => $d['direccion'],
                'horario' => $d['horario'], 'estado' => 'Activo', 'username' => $d['username']]);

            $password = Str::password(14, symbols: false);
            User::query()->create(['username' => $d['username'], 'password' => $password, 'role' => 'encargado', 'local_id' => $local->id]);
            $this->command->info("Encargado de {$d['nombre']}: {$d['username']} / {$password}");

            foreach ($d['servicios'] as [$nombre, $precio, $pct]) {
                Servicio::query()->create(['nombre' => $nombre, 'precio' => $precio, 'porcentaje_trabajador' => $pct, 'local_id' => $local->id]);
            }
            foreach ($d['trabajadores'] as $completo) {
                [$nombre, $apellido] = explode(' ', $completo, 2);
                $t = Trabajador::query()->create(['nombre' => $nombre, 'apellido' => $apellido, 'fecha_ingreso' => now()->toDateString(), 'local_id' => $local->id]);
                TrabajadorLocal::query()->insert(['trabajador_id' => $t->id, 'local_id' => $local->id, 'estado' => 'activo', 'desde' => now(), 'actualizado' => now()]);
            }
            foreach ($d['productos'] as [$nombre, $stock, $minimo, $precio]) {
                Producto::query()->create(['local_id' => $local->id, 'nombre' => $nombre, 'stock' => $stock, 'stock_minimo' => $minimo, 'precio' => $precio]);
            }
        }
    }
}
