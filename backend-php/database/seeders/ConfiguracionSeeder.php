<?php

namespace Database\Seeders;

use App\Models\Configuracion;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;

class ConfiguracionSeeder extends Seeder
{
    public function run(): void
    {
        $defecto = [
            'nombre_negocio' => 'Koko', 'email' => '', 'telefono' => '', 'direccion' => '',
            'tema_primario' => '#7e47eb', 'tema_secundario' => '#f59e0b', 'tema_preset' => 'lavanda',
            'logo_mime' => '', 'logo_datos' => '', 'logo_version' => '0',
        ];
        Configuracion::query()->insertOrIgnore(array_map(fn ($k, $v) => ['clave' => $k, 'valor' => $v], array_keys($defecto), $defecto));
        Cache::forget('configuracion.todas');
    }
}
