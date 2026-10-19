<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

/** Hace cumplir la regla de capas: si alguien la rompe, este test falla y dice dónde. */
class ArquitecturaTest extends TestCase
{
    private const APP = __DIR__.'/../../app';

    public function test_cada_modulo_tiene_las_tres_capas_un_servicio_y_un_controlador(): void
    {
        foreach (glob(self::APP.'/Modules/*', GLOB_ONLYDIR) as $dir) {
            $modulo = basename($dir);
            foreach (['Domain', 'Application', 'Infrastructure'] as $capa) {
                $this->assertDirectoryExists("{$dir}/{$capa}", "{$modulo} no tiene {$capa}/");
            }
            $this->assertFileExists("{$dir}/routes.php");
            $this->assertSame(["{$modulo}Service.php"], array_map('basename', glob("{$dir}/Application/*.php")), "{$modulo}: Application/ debe tener solo {$modulo}Service");
            $this->assertCount(1, glob("{$dir}/Infrastructure/*Controller.php"), "{$modulo}: debe haber un solo controlador");
        }
    }

    public function test_las_dependencias_van_siempre_hacia_el_dominio(): void
    {
        $errores = [];
        foreach ($this->archivos(self::APP) as $archivo => $usos) {
            $ruta = str_replace(realpath(self::APP).'/', '', $archivo);
            preg_match('#^Modules/(\w+)/(\w+)/#', $ruta, $m);
            [$modulo, $capa] = [$m[1] ?? null, $m[2] ?? null];

            foreach ($usos as $uso) {
                $otro = preg_match('#^App\\\\Modules\\\\(\w+)\\\\(\w+)#', $uso, $u) ? [$u[1], $u[2]] : null;
                $error = match (true) {
                    str_starts_with($ruta, 'Core/') && $otro !== null => 'Core no puede usar módulos',
                    $capa === 'Domain' && in_array($otro[1] ?? '', ['Application', 'Infrastructure'], true) => 'Domain solo puede usar Domain',
                    $capa === 'Application' && ($otro[1] ?? '') === 'Infrastructure' => 'Application no puede usar Infrastructure',
                    $modulo !== null && $otro !== null && $otro[0] !== $modulo && $otro[1] !== 'Domain' => 'otro módulo solo se usa por su Domain',
                    default => null,
                };
                if ($error) {
                    $errores[] = "{$ruta} usa {$uso}: {$error}";
                }
            }
        }
        $this->assertSame([], $errores);
    }

    /** @return array<string, list<string>> archivo => clases que importa con "use" */
    private function archivos(string $dir): array
    {
        $resultado = [];
        $it = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($dir));
        foreach ($it as $f) {
            if ($f->getExtension() === 'php') {
                preg_match_all('/^use ([^;\s]+)/m', file_get_contents($f->getPathname()), $m);
                $resultado[realpath($f->getPathname())] = $m[1];
            }
        }
        return $resultado;
    }
}
