<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\UsaUuid;
use Illuminate\Database\Eloquent\Model;

class Producto extends Model
{
    use UsaUuid;

    protected $table = 'productos';
    protected $fillable = ['local_id', 'nombre', 'stock', 'stock_minimo', 'precio'];
    protected $casts = ['stock' => 'integer', 'stock_minimo' => 'integer', 'precio' => 'float'];
}
