<?php

namespace Database\Seeders;

use App\Core\Permisos\Catalogo;
use App\Models\Rol;
use App\Models\RolPermiso;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;

/** Roles base. Se crean solo si no existen (así se respetan las ediciones del administrador). */
class RolesSeeder extends Seeder
{
    public function run(): void
    {
        foreach (Catalogo::rolesBase() as $rol) {
            $creado = Rol::query()->firstOrCreate(['id' => $rol['id']], [
                'nombre' => $rol['nombre'], 'descripcion' => $rol['descripcion'],
                'alcance' => $rol['alcance'], 'es_sistema' => $rol['es_sistema'],
            ]);
            if ($creado->wasRecentlyCreated) {
                RolPermiso::query()->insert(array_map(fn ($p) => ['rol_id' => $rol['id'], 'permiso' => $p], $rol['permisos']));
            }
        }
        // El administrador siempre tiene todos los permisos del catálogo (incluidos los nuevos)
        RolPermiso::query()->insertOrIgnore(array_map(fn ($p) => ['rol_id' => 'admin', 'permiso' => $p], Catalogo::ids()));
        Cache::forget('rol.admin');
        Cache::forget('rol.encargado');
    }
}
