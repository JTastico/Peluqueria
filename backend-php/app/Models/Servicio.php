<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\UsaUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Servicio extends Model
{
    use UsaUuid;

    protected $table = 'servicios';
    protected $fillable = ['nombre', 'precio', 'porcentaje_trabajador', 'local_id'];
    protected $casts = ['precio' => 'float', 'porcentaje_trabajador' => 'float'];

    public function local(): BelongsTo
    {
        return $this->belongsTo(Local::class, 'local_id');
    }
}
