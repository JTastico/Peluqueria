import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, ImageUp, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBrand } from "@/hooks/useBrand";
import { API_URL } from "@/lib/api";
import { PRESETS, Tema, aplicarTema, contrasteConBlanco, hexValido } from "@/lib/theme";

const MAX_LOGO = 512 * 1024;

const jsonOError = async (res: Response) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "No se pudo guardar.");
  return data;
};

export function AparienciaTab() {
  const { tema, logoUrl, nombre, refrescar } = useBrand();
  const [borrador, setBorrador] = useState<Tema>(tema);
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const archivo = useRef<HTMLInputElement>(null);

  // Si el tema guardado cambia (p. ej. al cargar), el borrador lo sigue
  useEffect(() => { setBorrador(tema); }, [tema]);

  // Al salir de la pestaña sin guardar se restaura el tema vigente
  useEffect(() => () => aplicarTema(tema), [tema]);

  const previsualizar = (cambio: Partial<Tema>) => {
    const nuevo = { ...borrador, ...cambio };
    setBorrador(nuevo);
    if (hexValido(nuevo.primario) && hexValido(nuevo.secundario)) aplicarTema(nuevo);
  };

  const contraste = hexValido(borrador.primario) ? contrasteConBlanco(borrador.primario) : 0;
  const contrasteOk = contraste >= 4.5;
  const hayCambios = borrador.primario !== tema.primario || borrador.secundario !== tema.secundario;

  const guardarTema = async () => {
    setGuardando(true);
    try {
      await jsonOError(await fetch(`${API_URL}/configuracion/tema`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(borrador),
      }));
      await refrescar();
      toast.success("Paleta de colores actualizada para todo el sistema.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  };

  const subirLogo = async (file: File | undefined) => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { toast.error("El logo debe ser PNG, JPG o WebP."); return; }
    if (file.size > MAX_LOGO) { toast.error("El logo pesa demasiado (máximo 512 KB)."); return; }
    setSubiendo(true);
    try {
      const datos = await new Promise<string>((ok, fallo) => {
        const lector = new FileReader();
        lector.onload = () => ok(String(lector.result).split(",")[1] ?? "");
        lector.onerror = () => fallo(new Error("No se pudo leer el archivo."));
        lector.readAsDataURL(file);
      });
      await jsonOError(await fetch(`${API_URL}/configuracion/logo`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mime: file.type, datos }),
      }));
      await refrescar();
      toast.success("Logo actualizado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo subir el logo.");
    } finally {
      setSubiendo(false);
      if (archivo.current) archivo.current.value = "";
    }
  };

  const quitarLogo = async () => {
    try {
      await jsonOError(await fetch(`${API_URL}/configuracion/logo`, { method: "DELETE" }));
      await refrescar();
      toast.success("Logo eliminado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo quitar el logo.");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Paleta de colores</CardTitle>
          <CardDescription>Se aplica a todo el sistema y a todos los usuarios. Mientras eliges ves una vista previa; no se guarda hasta que pulses "Guardar".</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div role="radiogroup" aria-label="Paletas predefinidas" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PRESETS.map(p => {
              const activo = borrador.preset === p.preset && borrador.primario === p.primario && borrador.secundario === p.secundario;
              return (
                <button key={p.preset} type="button" role="radio" aria-checked={activo}
                  onClick={() => previsualizar({ primario: p.primario, secundario: p.secundario, preset: p.preset })}
                  className={`relative cursor-pointer rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    activo ? "border-primary ring-2 ring-primary" : "hover:bg-muted"}`}>
                  <span className="mb-2 flex h-8 overflow-hidden rounded-lg" aria-hidden>
                    <span className="flex-1" style={{ background: p.primario }} />
                    <span className="w-1/3" style={{ background: p.secundario }} />
                  </span>
                  <span className="text-sm font-medium">{p.nombre}</span>
                  {activo && <Check className="absolute right-2 top-2 h-4 w-4 text-primary" aria-hidden />}
                </button>
              );
            })}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {([["primario", "Color principal"], ["secundario", "Color de acento"]] as const).map(([clave, etiqueta]) => (
              <div key={clave}>
                <Label htmlFor={`c-${clave}`}>{etiqueta}</Label>
                <div className="mt-1 flex items-center gap-3">
                  <input id={`c-${clave}`} type="color" value={hexValido(borrador[clave]) ? borrador[clave] : "#000000"}
                    onChange={e => previsualizar({ [clave]: e.target.value, preset: "personalizado" })}
                    className="h-11 w-14 cursor-pointer rounded-lg border bg-white p-1" aria-label={etiqueta} />
                  <Input value={borrador[clave]} maxLength={7} className="font-mono"
                    onChange={e => previsualizar({ [clave]: e.target.value.trim(), preset: "personalizado" })} />
                </div>
              </div>
            ))}
          </div>

          {!hexValido(borrador.primario) || !hexValido(borrador.secundario) ? (
            <p className="flex items-center gap-2 text-sm text-red-700"><TriangleAlert className="h-4 w-4" aria-hidden /> Usa el formato #RRGGBB (por ejemplo #7e47eb).</p>
          ) : !contrasteOk ? (
            <p className="flex items-center gap-2 text-sm text-red-700" role="alert">
              <TriangleAlert className="h-4 w-4" aria-hidden /> El color principal es demasiado claro ({contraste.toFixed(1)}:1). Los botones llevan texto blanco y necesitan al menos 4.5:1 para leerse bien.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Contraste del texto blanco sobre el color principal: <strong>{contraste.toFixed(1)}:1</strong> ✓</p>
          )}

          <div className="rounded-xl border bg-muted/40 p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Vista previa</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button">Botón principal</Button>
              <Button type="button" variant="outline">Secundario</Button>
              <span className="rounded-full bg-stylepro-lavender-100 px-3 py-1 text-sm font-medium text-stylepro-lavender-800">Etiqueta</span>
              <span className="rounded-full bg-stylepro-gold-100 px-3 py-1 text-sm font-medium text-stylepro-gold-800">Acento</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={guardarTema} disabled={!hayCambios || !contrasteOk || !hexValido(borrador.secundario) || guardando}>
              {guardando ? "Guardando..." : "Guardar paleta"}
            </Button>
            <Button variant="outline" disabled={!hayCambios} onClick={() => { setBorrador(tema); aplicarTema(tema); }}>Descartar</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Logo</CardTitle>
          <CardDescription>Aparece en la barra lateral, el inicio de sesión y las páginas de error. PNG, JPG o WebP, máximo 512 KB. Solo el administrador puede cambiarlo.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-xl border bg-white">
            {logoUrl
              ? <img src={logoUrl} alt={`Logo actual de ${nombre}`} className="h-20 w-20 object-contain" />
              : <span className="px-2 text-center text-xs text-muted-foreground">Sin logo</span>}
          </div>
          <div className="flex flex-wrap gap-3">
            <input ref={archivo} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" id="logo-archivo"
              onChange={e => subirLogo(e.target.files?.[0])} />
            <Button type="button" onClick={() => archivo.current?.click()} disabled={subiendo}>
              <ImageUp className="mr-2 h-4 w-4" aria-hidden /> {subiendo ? "Subiendo..." : logoUrl ? "Cambiar logo" : "Subir logo"}
            </Button>
            {logoUrl && (
              <Button type="button" variant="outline" onClick={quitarLogo}>
                <Trash2 className="mr-2 h-4 w-4" aria-hidden /> Quitar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
