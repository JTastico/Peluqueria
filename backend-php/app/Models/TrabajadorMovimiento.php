<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\UsaUuid;
use Illuminate\Database\Eloquent\Model;

class TrabajadorMovimiento extends Model
{
    use UsaUuid;

    protected $table = 'trabajador_movimientos';
    protected $fillable = ['trabajador_id', 'local_origen', 'local_destino', 'fecha', 'motivo', 'usuario'];
}
