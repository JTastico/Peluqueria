<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\UsaUuid;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Venta extends Model
{
    use UsaUuid;

    protected $table = 'ventas';
    protected $fillable = ['local_id', 'fecha_hora', 'total', 'metodo_pago', 'estado', 'registrado_por', 'creado'];
    protected $casts = ['total' => 'float'];

    public function items(): HasMany
    {
        return $this->hasMany(VentaItem::class, 'venta_id');
    }

    public function local(): BelongsTo
    {
        return $this->belongsTo(Local::class, 'local_id');
    }

    public function scopeActivas(Builder $q): Builder
    {
        return $q->where('ventas.estado', 'activa');
    }

    /** Rango [desde, hasta) sobre fecha_hora, sin envolver la columna en funciones (así usa el índice). */
    public function scopeEntre(Builder $q, string $desde, string $hasta): Builder
    {
        return $q->where('ventas.fecha_hora', '>=', $desde)->where('ventas.fecha_hora', '<', $hasta);
    }
}
