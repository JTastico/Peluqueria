<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Historial de un trabajador en un local (activo / pausado). Clave compuesta: se escribe por consulta. */
class TrabajadorLocal extends Model
{
    protected $table = 'trabajador_locales';
    public $incrementing = false;
    public $timestamps = false;
    protected $primaryKey = null;
    protected $guarded = [];

    public function trabajador(): BelongsTo
    {
        return $this->belongsTo(Trabajador::class, 'trabajador_id');
    }

    public function local(): BelongsTo
    {
        return $this->belongsTo(Local::class, 'local_id');
    }
}
