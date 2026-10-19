import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Scissors, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useConfirmar } from "@/hooks/useConfirmar";
import { API_URL, formatMoney, textoReparto } from "@/lib/ventas";

interface Servicio {
  id: string; nombre: string; precio: number; porcentaje_trabajador: number; local_id: string; local_nombre: string;
}

// Porcentaje del precio que se lleva el trabajador; el resto es del local.
const REPARTOS = [50, 60, 70, 80, 40, 30, 20];

function SelectorReparto({ valor, onChange }: { valor: number; onChange: (n: number) => void }) {
  const esPredefinido = REPARTOS.includes(valor);
  return (
    <div>
      <Label className="mb-1.5 block">¿Cómo se reparte? <span className="font-normal text-muted-foreground">({textoReparto(valor)})</span></Label>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7" role="group" aria-label="Reparto trabajador y local">
        {REPARTOS.map(p => (
          <button key={p} type="button" aria-pressed={valor === p} onClick={() => onChange(p)}
            className={`min-h-[56px] cursor-pointer rounded-xl border px-1 text-center text-sm font-semibold leading-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${valor === p ? "border-primary bg-primary text-primary-foreground" : "bg-white hover:bg-muted"}`}>
            {p}<span className="font-normal opacity-80"> / {100 - p}</span>
            <span className="block text-[10px] font-normal opacity-80">trab. / local</span>
          </button>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2 text-sm">
        <Label htmlFor="otro-pct" className="font-normal text-muted-foreground">Otro porcentaje para el trabajador:</Label>
        <Input id="otro-pct" type="number" min={0} max={100} step="0.5" inputMode="decimal" className="w-24"
          value={esPredefinido ? "" : valor} placeholder="%" onChange={e => { const n = Number(e.target.value); if (e.target.value !== "" && n >= 0 && n <= 100) onChange(n); }} />
      </div>
    </div>
  );
}

const Servicios = () => {
  const { localesPermitidos: locales } = useAuth();
  const { confirmar, dialogo } = useConfirmar();
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [filtroLocal, setFiltroLocal] = useState<string>("todos");
  const [cargando, setCargando] = useState(true);

  // Alta
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [pct, setPct] = useState(50);
  const [destinos, setDestinos] = useState<string[]>(locales.map(l => l.id));
  const [guardando, setGuardando] = useState(false);

  // Edición
  const [editando, setEditando] = useState<Servicio | null>(null);
  const [eNombre, setENombre] = useState("");
  const [ePrecio, setEPrecio] = useState("");
  const [ePct, setEPct] = useState(50);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/servicios`);
      if (!res.ok) throw new Error();
      setServicios(await res.json());
    } catch {
      toast.error("No se pudieron cargar los servicios.");
    } finally {
      setCargando(false);
    }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const visibles = useMemo(() => servicios.filter(s => filtroLocal === "todos" || s.local_id === filtroLocal), [servicios, filtroLocal]);
  const porLocal = useMemo(() => {
    const m = new Map<string, Servicio[]>();
    for (const s of visibles) m.set(s.local_nombre, [...(m.get(s.local_nombre) ?? []), s]);
    return [...m.entries()];
  }, [visibles]);

  const agregar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { toast.error("Escribe el nombre del servicio."); return; }
    if (!(Number(precio) > 0)) { toast.error("Escribe el precio."); return; }
    if (destinos.length === 0) { toast.error("Elige al menos un local."); return; }
    setGuardando(true);
    try {
      const res = await fetch(`${API_URL}/servicios`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, precio: Number(precio), porcentaje_trabajador: pct, locales: destinos }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo agregar.");
      toast.success(`«${nombre.trim()}» agregado a ${data.length} local${data.length === 1 ? "" : "es"}.`);
      setNombre(""); setPrecio(""); // el reparto y los locales se conservan para cargar varios seguidos
      cargar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo agregar.");
    } finally {
      setGuardando(false);
    }
  };

  const abrirEditar = (s: Servicio) => { setEditando(s); setENombre(s.nombre); setEPrecio(String(s.precio)); setEPct(s.porcentaje_trabajador); };

  const guardarEdicion = async () => {
    if (!editando) return;
    try {
      const res = await fetch(`${API_URL}/servicios/${editando.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: eNombre, precio: Number(ePrecio), porcentaje_trabajador: ePct }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo guardar.");
      toast.success("Servicio actualizado. Las ventas anteriores no cambian.");
      setEditando(null);
      cargar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar.");
    }
  };

  const eliminar = async (s: Servicio) => {
    if (!(await confirmar({ titulo: `¿Eliminar «${s.nombre}»?`, descripcion: `Se quita de ${s.local_nombre}. Las ventas ya registradas se conservan tal como se hicieron.`, textoConfirmar: "Sí, eliminar", destructivo: true }))) return;
    try {
      const res = await fetch(`${API_URL}/servicios/${s.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo eliminar.");
      toast.success("Servicio eliminado.");
      cargar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar.");
    }
  };

  const alternarDestino = (id: string) => setDestinos(d => (d.includes(id) ? d.filter(x => x !== id) : [...d, id]));

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Servicios y precios</h1>
        <p className="text-muted-foreground">Lo que se ofrece, cuánto cuesta y cómo se reparte entre el trabajador y el local.</p>
      </div>

      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-lg"><Plus className="h-5 w-5" aria-hidden /> Nuevo servicio</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={agregar} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
              <div>
                <Label htmlFor="s-nombre">Nombre</Label>
                <Input id="s-nombre" className="h-12 text-base" value={nombre} maxLength={255} onChange={e => setNombre(e.target.value)} placeholder="Ej.: Corte de pelo" />
              </div>
              <div>
                <Label htmlFor="s-precio">Precio (S/)</Label>
                <Input id="s-precio" className="h-12 text-base" type="number" min="0" step="0.5" inputMode="decimal" value={precio} onChange={e => setPrecio(e.target.value)} placeholder="25" />
              </div>
            </div>

            <SelectorReparto valor={pct} onChange={setPct} />

            {locales.length > 1 && (
              <div>
                <Label className="mb-1.5 block">¿En qué locales?</Label>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Locales donde se ofrece">
                  {locales.map(l => (
                    <button key={l.id} type="button" aria-pressed={destinos.includes(l.id)} onClick={() => alternarDestino(l.id)}
                      className={`min-h-[44px] cursor-pointer rounded-xl border px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${destinos.includes(l.id) ? "border-primary bg-primary text-primary-foreground" : "bg-white hover:bg-muted"}`}>
                      {l.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button type="submit" size="lg" disabled={guardando}>{guardando ? "Agregando..." : "Agregar servicio"}</Button>
          </form>
        </CardContent>
      </Card>

      {locales.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por local">
          {[{ id: "todos", nombre: "Todos los locales" }, ...locales].map(l => (
            <button key={l.id} type="button" aria-pressed={filtroLocal === l.id} onClick={() => setFiltroLocal(l.id)}
              className={`min-h-[40px] cursor-pointer rounded-full border px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${filtroLocal === l.id ? "border-primary bg-primary text-primary-foreground" : "bg-white hover:bg-muted"}`}>
              {l.nombre}
            </button>
          ))}
        </div>
      )}

      {!cargando && porLocal.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          <Scissors className="h-6 w-6" aria-hidden /> Aún no hay servicios. Agrega el primero arriba.
        </div>
      )}

      {porLocal.map(([local, lista]) => (
        <Card key={local} className="border border-border/60 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base">{local} <Badge variant="secondary" className="ml-2">{lista.length}</Badge></CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y">
              {lista.map(s => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium">{s.nombre}</p>
                    <p className="text-sm text-muted-foreground">{textoReparto(s.porcentaje_trabajador)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="mr-2 text-lg font-bold tabular-nums">{formatMoney(s.precio)}</span>
                    <Button variant="outline" className="min-h-[44px]" onClick={() => abrirEditar(s)} aria-label={`Editar ${s.nombre}`}><Pencil className="mr-1.5 h-4 w-4" aria-hidden /> Editar</Button>
                    <Button variant="outline" className="min-h-[44px] border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800" onClick={() => eliminar(s)} aria-label={`Eliminar ${s.nombre}`}><Trash2 className="mr-1.5 h-4 w-4" aria-hidden /> Eliminar</Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!editando} onOpenChange={o => !o && setEditando(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar servicio</DialogTitle>
            <DialogDescription>{editando?.local_nombre}. Los cambios valen desde ahora; las ventas ya registradas conservan su precio y reparto.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
              <div><Label htmlFor="e-nombre">Nombre</Label><Input id="e-nombre" value={eNombre} maxLength={255} onChange={e => setENombre(e.target.value)} /></div>
              <div><Label htmlFor="e-precio">Precio (S/)</Label><Input id="e-precio" type="number" min="0" step="0.5" inputMode="decimal" value={ePrecio} onChange={e => setEPrecio(e.target.value)} /></div>
            </div>
            <SelectorReparto valor={ePct} onChange={setEPct} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditando(null)}>Cancelar</Button>
            <Button onClick={guardarEdicion}>Guardar cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {dialogo}
    </div>
  );
};

export default Servicios;
