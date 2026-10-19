import { useState } from "react";
import { toast } from "sonner";
import { Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { FUENTES, TAMANOS, Preferencias, aplicarPreferencias } from "@/lib/prefs";

// Cada usuario elige el tipo y el tamaño de letra que le resulte cómodo. Solo afecta a su cuenta.
export function AppearanceDialog() {
  const { user, guardarPreferencias } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const [prefs, setPrefs] = useState<Preferencias>(user?.preferencias ?? { fuente: "predeterminada", tamano: "normal" });
  const [guardando, setGuardando] = useState(false);

  const abrir = () => {
    if (user) setPrefs(user.preferencias);
    setAbierto(true);
  };

  // Vista previa en vivo: se aplica mientras se elige; si se cancela, se vuelve a lo guardado
  const elegir = (cambio: Partial<Preferencias>) => {
    const nuevo = { ...prefs, ...cambio };
    setPrefs(nuevo);
    aplicarPreferencias(nuevo);
  };

  const cerrar = (valor: boolean) => {
    if (!valor && user) aplicarPreferencias(user.preferencias);
    setAbierto(valor);
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      await guardarPreferencias(prefs);
      toast.success("Preferencias guardadas.");
      setAbierto(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudieron guardar.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="icon" className="h-8 w-8" onClick={abrir} title="Tipo y tamaño de letra" aria-label="Tipo y tamaño de letra">
        <Type className="h-4 w-4" />
      </Button>
      <Dialog open={abierto} onOpenChange={cerrar}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tipo y tamaño de letra</DialogTitle>
            <DialogDescription>Es solo para tu cuenta: otros usuarios ven su propia configuración.</DialogDescription>
          </DialogHeader>

          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-medium">Tipo de letra</legend>
            <div className="grid gap-2">
              {FUENTES.map(f => (
                <label key={f.id}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 transition-colors focus-within:ring-2 focus-within:ring-ring ${
                    prefs.fuente === f.id ? "border-primary bg-stylepro-lavender-50" : "hover:bg-muted"}`}>
                  <span>
                    <span className="block font-medium" style={{ fontFamily: f.pila }}>{f.nombre}</span>
                    <span className="text-xs text-muted-foreground">{f.detalle}</span>
                  </span>
                  <input type="radio" name="fuente" className="h-4 w-4 accent-[hsl(var(--primary))]"
                    checked={prefs.fuente === f.id} onChange={() => elegir({ fuente: f.id })} />
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-medium">Tamaño</legend>
            <div className="grid grid-cols-4 gap-2">
              {TAMANOS.map(t => (
                <button key={t.id} type="button" aria-pressed={prefs.tamano === t.id} onClick={() => elegir({ tamano: t.id })}
                  className={`min-h-[44px] cursor-pointer rounded-lg border px-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    prefs.tamano === t.id ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                  {t.nombre}
                </button>
              ))}
            </div>
          </fieldset>

          <DialogFooter>
            <Button variant="outline" onClick={() => cerrar(false)}>Cancelar</Button>
            <Button onClick={guardar} disabled={guardando}>{guardando ? "Guardando..." : "Guardar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
