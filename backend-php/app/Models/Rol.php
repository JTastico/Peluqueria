<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Rol extends Model
{
    protected $table = 'roles';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;
    protected $fillable = ['id', 'nombre', 'descripcion', 'alcance', 'es_sistema'];
    protected $casts = ['es_sistema' => 'boolean'];

    public function permisos(): HasMany
    {
        return $this->hasMany(RolPermiso::class, 'rol_id');
    }

    public function usuarios(): HasMany
    {
        return $this->hasMany(User::class, 'role');
    }
}
