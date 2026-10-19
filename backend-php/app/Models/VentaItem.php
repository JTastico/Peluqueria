<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\UsaUuid;
use Illuminate\Database\Eloquent\Model;

class VentaItem extends Model
{
    use UsaUuid;

    protected $table = 'venta_items';
    protected $fillable = [
        'venta_id', 'servicio_id', 'servicio_nombre', 'trabajador_id', 'trabajador_nombre',
        'precio', 'porcentaje_trabajador', 'monto_trabajador', 'monto_local',
    ];
    protected $casts = [
        'precio' => 'float', 'porcentaje_trabajador' => 'float', 'monto_trabajador' => 'float', 'monto_local' => 'float',
    ];
}
