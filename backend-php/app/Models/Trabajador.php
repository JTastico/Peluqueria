<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\UsaUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Trabajador extends Model
{
    use UsaUuid;

    protected $table = 'trabajadores';
    protected $fillable = ['nombre', 'apellido', 'telefono', 'fecha_ingreso', 'local_id'];

    public function localActual(): BelongsTo
    {
        return $this->belongsTo(Local::class, 'local_id');
    }

    public function asignaciones(): HasMany
    {
        return $this->hasMany(TrabajadorLocal::class, 'trabajador_id');
    }

    public function nombreCompleto(): string
    {
        return trim("{$this->nombre} {$this->apellido}");
    }
}
