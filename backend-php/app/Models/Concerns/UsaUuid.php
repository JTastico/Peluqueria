<?php

declare(strict_types=1);

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

/** Clave primaria UUID (CHAR(36)) generada por la aplicación, sin timestamps de Laravel. */
trait UsaUuid
{
    use HasUuids;

    public function initializeUsaUuid(): void
    {
        $this->timestamps = false;
    }
}
