import { useState } from "react";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { API_URL } from "@/lib/api";

const VACIO = { actual: "", nueva: "", repetir: "" };

export function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(VACIO);
  const [saving, setSaving] = useState(false);

  const cerrar = (value: boolean) => {
    setOpen(value);
    if (!value) setForm(VACIO);
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.nueva.length < 8) { toast.error("La nueva contraseña debe tener al menos 8 caracteres."); return; }
    if (form.nueva !== form.repetir) { toast.error("Las contraseñas nuevas no coinciden."); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/auth/cambiar-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actual: form.actual, nueva: form.nueva }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo cambiar la contraseña.");
      toast.success("Contraseña actualizada.");
      cerrar(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo cambiar la contraseña.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setOpen(true)} title="Cambiar contraseña">
        <KeyRound className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={cerrar}>
        <DialogContent>
          <form onSubmit={guardar} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Cambiar contraseña</DialogTitle>
              <DialogDescription>Usa al menos 8 caracteres. No reutilices tu DNI ni tu usuario.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label htmlFor="pw-actual">Contraseña actual</Label>
                <Input id="pw-actual" type="password" autoComplete="current-password" value={form.actual}
                  onChange={e => setForm(f => ({ ...f, actual: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="pw-nueva">Nueva contraseña</Label>
                <Input id="pw-nueva" type="password" autoComplete="new-password" maxLength={72} value={form.nueva}
                  onChange={e => setForm(f => ({ ...f, nueva: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="pw-repetir">Repite la nueva contraseña</Label>
                <Input id="pw-repetir" type="password" autoComplete="new-password" maxLength={72} value={form.repetir}
                  onChange={e => setForm(f => ({ ...f, repetir: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => cerrar(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
