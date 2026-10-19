<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\UsaUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Local extends Model
{
    use UsaUuid;

    protected $table = 'locales';
    protected $fillable = ['nombre', 'type', 'direccion', 'telefono', 'horario', 'imagen', 'estado', 'username'];

    public function asignaciones(): HasMany
    {
        return $this->hasMany(TrabajadorLocal::class, 'local_id');
    }

    public function ventas(): HasMany
    {
        return $this->hasMany(Venta::class, 'local_id');
    }

    public function usuarios(): HasMany
    {
        return $this->hasMany(User::class, 'local_id');
    }
}
