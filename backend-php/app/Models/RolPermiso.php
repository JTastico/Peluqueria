<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Tabla puente sin id propio: solo se lee, se inserta y se borra por rol. */
class RolPermiso extends Model
{
    protected $table = 'rol_permisos';
    public $incrementing = false;
    public $timestamps = false;
    protected $primaryKey = null;
    protected $fillable = ['rol_id', 'permiso'];
}
