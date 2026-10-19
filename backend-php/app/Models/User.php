<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Concerns\UsaUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class User extends Model
{
    use UsaUuid;

    protected $table = 'users';
    protected $fillable = ['username', 'password', 'role', 'local_id', 'trabajador_id', 'pref_fuente', 'pref_tamano'];
    protected $hidden = ['password'];
    protected $casts = ['password' => 'hashed'];

    public function rol(): BelongsTo
    {
        return $this->belongsTo(Rol::class, 'role');
    }

    public function local(): BelongsTo
    {
        return $this->belongsTo(Local::class, 'local_id');
    }

    public function trabajador(): BelongsTo
    {
        return $this->belongsTo(Trabajador::class, 'trabajador_id');
    }

    /** Locales asignados a un rol de alcance "multi". */
    public function localesAsignados(): BelongsToMany
    {
        return $this->belongsToMany(Local::class, 'usuario_locales', 'user_id', 'local_id');
    }
}
