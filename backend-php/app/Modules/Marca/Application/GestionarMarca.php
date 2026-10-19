<?php

declare(strict_types=1);

namespace App\Modules\Marca\Application;

use App\Core\Exceptions\ApiException;
use App\Modules\Configuracion\Domain\ConfiguracionRepository;
use App\Modules\Marca\Domain\Contraste;
use App\Modules\Marca\Domain\ImagenLogo;

/** Apariencia del sistema: paleta de colores y logo (solo los cambia el administrador). */
final class GestionarMarca
{
    public function __construct(private readonly ConfiguracionRepository $config) {}

    /** Público: la pantalla de login también usa el tema y el logo. */
    public function obtener(): array
    {
        $c = $this->config->todas();
        return [
            'nombre_negocio' => ($c['nombre_negocio'] ?? '') ?: 'Koko',
            'tema' => [
                'primario' => ($c['tema_primario'] ?? '') ?: '#7e47eb',
                'secundario' => ($c['tema_secundario'] ?? '') ?: '#f59e0b',
                'preset' => ($c['tema_preset'] ?? '') ?: 'lavanda',
            ],
            'logo' => ($c['logo_mime'] ?? '') !== '' ? ['version' => $c['logo_version'] ?? '0'] : null,
        ];
    }

    /** @return array{mime:string,bytes:string,version:string} */
    public function logo(): array
    {
        $c = $this->config->todas();
        $datos = $this->config->logoDatos();
        if (($c['logo_mime'] ?? '') === '' || $datos === null) {
            throw ApiException::noEncontrado('Sin logo.');
        }
        return ['mime' => $c['logo_mime'], 'bytes' => base64_decode($datos), 'version' => $c['logo_version'] ?? '0'];
    }

    public function guardarTema(string $primario, string $secundario, string $preset): array
    {
        if (Contraste::conBlanco($primario) < Contraste::MINIMO_PRIMARIO) {
            throw ApiException::invalido('El color primario es demasiado claro: el texto blanco de los botones no se leería bien. Elige uno más oscuro.');
        }
        if (Contraste::conBlanco($secundario) < Contraste::MINIMO_SECUNDARIO) {
            throw ApiException::invalido('El color secundario es demasiado claro. Elige uno con más contraste.');
        }
        $tema = ['primario' => strtolower($primario), 'secundario' => strtolower($secundario), 'preset' => $preset];
        $this->config->guardar(['tema_primario' => $tema['primario'], 'tema_secundario' => $tema['secundario'], 'tema_preset' => $preset]);
        return ['tema' => $tema];
    }

    public function guardarLogo(string $mime, string $base64): array
    {
        $logo = ImagenLogo::desdeBase64($mime, $base64);
        $version = bin2hex(random_bytes(6));
        $this->config->guardar(['logo_mime' => $logo->mime, 'logo_datos' => $logo->base64, 'logo_version' => $version]);
        return ['logo' => ['version' => $version]];
    }

    public function eliminarLogo(): array
    {
        $this->config->guardar(['logo_mime' => '', 'logo_datos' => '', 'logo_version' => '0']);
        return ['logo' => null];
    }
}
