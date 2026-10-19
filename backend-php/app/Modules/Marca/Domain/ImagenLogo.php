<?php

declare(strict_types=1);

namespace App\Modules\Marca\Domain;

use App\Core\Exceptions\ApiException;

/** Un logo válido: PNG/JPG/WebP real (se comprueba el contenido, no lo que declara el cliente). */
final class ImagenLogo
{
    public const MAX_BYTES = 512 * 1024;
    private const MIMES = ['image/png', 'image/jpeg', 'image/webp'];
    private const MAX_LADO = 4000;

    private function __construct(public readonly string $mime, public readonly string $base64) {}

    public static function desdeBase64(string $mime, string $base64): self
    {
        $bytes = in_array($mime, self::MIMES, true) ? base64_decode($base64, true) : false;
        if ($bytes === false) {
            throw ApiException::invalido('El logo debe ser una imagen PNG, JPG o WebP.');
        }
        if ($bytes === '' || strlen($bytes) > self::MAX_BYTES) {
            throw ApiException::invalido('El logo pesa demasiado (máximo 512 KB).');
        }
        $info = @getimagesizefromstring($bytes);
        if ($info === false || $info['mime'] !== $mime) {
            throw ApiException::invalido('El archivo no es una imagen válida.');
        }
        if ($info[0] > self::MAX_LADO || $info[1] > self::MAX_LADO) {
            throw ApiException::invalido('La imagen es demasiado grande en píxeles (máximo 4000).');
        }
        return new self($mime, $base64);
    }
}
