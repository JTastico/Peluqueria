import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Lock, Pencil, Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { API_URL } from "@/lib/api";
import { useConfirmar } from "@/hooks/useConfirmar";

export interface Rol {
  id: string; nombre: string; descripcion: string; alcance: "global" | "local" | "multi";
  es_sistema: boolean; usuarios: number; permisos: string[];
}
interface Catalogo {
  grupos: { id: string; nombre: string }[];
  permisos: { id: string; grupo: string; nombre: string; detalle?: string }[];
}

export const ALCANCES = {
  local: { nombre: "Un solo local", detalle: "Solo ve y opera en el local que tiene asignado." },
  multi: { nombre: "Varios locales", detalle: "Entra a los locales que el administrador le asigne (ideal para quien rota entre locales)." },
  global: { nombre: "Todos los locales", detalle: "Ve y opera en todos los locales, incluidos los que se creen después." },
} as const;

const VACIO = { nombre: "", descripcion: "", alcance: "local" as Rol["alcance"], permisos: [] as string[] };

export function RolesTab() {
  const { confirmar, dialogo } = useConfirmar();
  const [roles, setRoles] = useState<Rol[]>([]);
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [editando, setEditando] = useState<Rol | "nuevo" | null>(null);
  const [form, setForm] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/roles`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setRoles(data.roles);
      setCatalogo(data.catalogo);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudieron cargar los roles.");
    }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const abrirNuevo = () => { setForm(VACIO); setEditando("nuevo"); };
  const abrirEditar = (r: Rol) => {
    setForm({ nombre: r.nombre, descripcion: r.descripcion, alcance: r.alcance, permisos: r.permisos });
    setEditando(r);
  };
  const soloLectura = editando !== null && editando !== "nuevo" && editando.id === "admin";

  const alternar = (id: string, marcado: boolean) =>
    setForm(f => ({ ...f, permisos: marcado ? [...f.permisos, id] : f.permisos.filter(p => p !== id) }));

  const guardar = async () => {
    if (!form.nombre.trim()) { toast.error("Ponle un nombre al rol."); return; }
    setGuardando(true);
    try {
      const nuevo = editando === "nuevo";
      const res = await fetch(`${API_URL}/roles${nuevo ? "" : `/${(editando as Rol).id}`}`, {
        method: nuevo ? "POST" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo guardar el rol.");
      toast.success(nuevo ? "Rol creado." : "Rol actualizado.");
      setEditando(null);
      cargar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (r: Rol) => {
    if (!(await confirmar({ titulo: `¿Eliminar el rol «${r.nombre}»?`, descripcion: "Solo se puede eliminar si ningún usuario lo tiene.", textoConfirmar: "Sí, eliminar", destructivo: true }))) return;
    try {
      const res = await fetch(`${API_URL}/roles/${r.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo eliminar.");
      toast.success("Rol eliminado.");
      cargar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar.");
    }
  };

  return (
    <Card className="border border-border/60 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Roles y permisos</CardTitle>
          <CardDescription>Un rol es un conjunto de permisos y un alcance de locales. Para tu negocio bastan el Dueño y la Encargada; crea otros solo si los necesitas.</CardDescription>
        </div>
        <Button onClick={abrirNuevo}><Plus className="mr-1 h-4 w-4" aria-hidden /> Nuevo rol</Button>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {roles.map(r => (
          <div key={r.id} className="flex flex-col gap-3 rounded-xl border p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="flex items-center gap-2 font-semibold">
                  {r.nombre}
                  {r.id === "admin" && <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-label="No editable" />}
                </h3>
                <p className="mt-0.5 text-sm text-muted-foreground">{r.descripcion || "Sin descripción."}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button size="icon" variant="ghost" onClick={() => abrirEditar(r)} aria-label={`${r.id === "admin" ? "Ver" : "Editar"} rol ${r.nombre}`}>
                  <Pencil className="h-4 w-4" />
                </Button>
                {!r.es_sistema && (
                  <Button size="icon" variant="ghost" onClick={() => eliminar(r)} aria-label={`Eliminar rol ${r.nombre}`}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="secondary">{ALCANCES[r.alcance].nombre}</Badge>
              <Badge variant="outline">{r.permisos.length} permisos</Badge>
              <Badge variant="outline" className="gap-1"><Users className="h-3 w-3" aria-hidden /> {r.usuarios} usuario{r.usuarios === 1 ? "" : "s"}</Badge>
            </div>
          </div>
        ))}
      </CardContent>

      <Dialog open={editando !== null} onOpenChange={o => !o && setEditando(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editando === "nuevo" ? "Nuevo rol" : soloLectura ? "Administrador" : `Editar rol: ${(editando as Rol | null)?.nombre ?? ""}`}</DialogTitle>
            <DialogDescription>{soloLectura ? "El administrador tiene todos los permisos y no se puede modificar." : "Marca lo que este rol puede hacer."}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="rol-nombre">Nombre</Label>
                <Input id="rol-nombre" value={form.nombre} maxLength={80} disabled={soloLectura} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej.: Supervisor de zona" />
              </div>
              <div>
                <Label htmlFor="rol-desc">Descripción</Label>
                <Input id="rol-desc" value={form.descripcion} maxLength={255} disabled={soloLectura} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
              </div>
            </div>

            <fieldset disabled={soloLectura}>
              <legend className="mb-2 text-sm font-medium">¿A qué locales llega?</legend>
              <div className="grid gap-2">
                {(Object.keys(ALCANCES) as Rol["alcance"][]).map(a => (
                  <label key={a} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 focus-within:ring-2 focus-within:ring-ring ${form.alcance === a ? "border-primary bg-stylepro-lavender-50" : "hover:bg-muted"}`}>
                    <input type="radio" name="alcance" className="mt-1 h-4 w-4 accent-[hsl(var(--primary))]" checked={form.alcance === a} onChange={() => setForm(f => ({ ...f, alcance: a }))} />
                    <span><span className="block text-sm font-medium">{ALCANCES[a].nombre}</span><span className="text-xs text-muted-foreground">{ALCANCES[a].detalle}</span></span>
                  </label>
                ))}
              </div>
            </fieldset>

            {catalogo?.grupos.map(g => (
              <fieldset key={g.id} disabled={soloLectura}>
                <legend className="mb-2 text-sm font-semibold">{g.nombre}</legend>
                <div className="grid gap-2">
                  {catalogo.permisos.filter(p => p.grupo === g.id).map(p => (
                    <label key={p.id} className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-muted/60">
                      <Checkbox checked={form.permisos.includes(p.id)} onCheckedChange={v => alternar(p.id, v === true)} className="mt-0.5" />
                      <span><span className="block text-sm">{p.nombre}</span>{p.detalle && <span className="text-xs text-muted-foreground">{p.detalle}</span>}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditando(null)}>{soloLectura ? "Cerrar" : "Cancelar"}</Button>
            {!soloLectura && <Button onClick={guardar} disabled={guardando}>{guardando ? "Guardando..." : "Guardar rol"}</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {dialogo}
    </Card>
  );
}
