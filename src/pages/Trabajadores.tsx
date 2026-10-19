import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeftRight, History, MapPinPlus, PauseCircle, PlayCircle, Plus, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useConfirmar } from "@/hooks/useConfirmar";
import { AgregarALocalDialog, HistorialDialog, TransferirDialog } from "@/components/TrasladoTrabajador";
import { API_URL, formatMoney } from "@/lib/ventas";

interface Trabajador {
  id: string; nombre: string; apellido: string; local_id: string; local_nombre: string;
  asignacion_estado: "activo" | "pausado"; local_actual_id: string; local_actual_nombre: string;
  servicios_mes: number; generado_mes: number; comision_mes: number;
}

const nombreCompleto = (t: { nombre: string; apellido: string }) => `${t.nombre} ${t.apellido}`.trim();

const Trabajadores = () => {
  const { can, localesPermitidos: locales, localId: authLocalId } = useAuth();
  const { confirmar, dialogo } = useConfirmar();
  const [lista, setLista] = useState<Trabajador[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroLocal, setFiltroLocal] = useState("todos");

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [localNuevo, setLocalNuevo] = useState(locales.find(l => l.id === authLocalId)?.id ?? locales[0]?.id ?? "");
  const [guardando, setGuardando] = useState(false);

  const [aTransferir, setATransferir] = useState<Trabajador | null>(null);
  const [aAgregar, setAAgregar] = useState<Trabajador | null>(null);
  const [verHistorial, setVerHistorial] = useState<Trabajador | null>(null);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/trabajadores`);
      if (!res.ok) throw new Error();
      setLista(await res.json());
    } catch {
      toast.error("No se pudieron cargar los trabajadores.");
    } finally {
      setCargando(false);
    }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const visibles = useMemo(() => lista.filter(t => filtroLocal === "todos" || t.local_id === filtroLocal), [lista, filtroLocal]);

  const agregar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { toast.error("Escribe el nombre del trabajador."); return; }
    if (!localNuevo) { toast.error("Elige el local."); return; }
    setGuardando(true);
    try {
      const res = await fetch(`${API_URL}/trabajadores`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nombre, apellido, local_id: localNuevo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo agregar.");
      toast.success(`${nombreCompleto(data)} agregado.`);
      setNombre(""); setApellido("");
      cargar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo agregar.");
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (t: Trabajador) => {
    if (!(await confirmar({ titulo: `¿Eliminar a ${nombreCompleto(t)}?`, descripcion: "Dejará de aparecer al cobrar. Sus ventas registradas se conservan con su nombre.", textoConfirmar: "Sí, eliminar", destructivo: true }))) return;
    try {
      const res = await fetch(`${API_URL}/trabajadores/${t.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo eliminar.");
      toast.success("Trabajador eliminado.");
      cargar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar.");
    }
  };

  const cambiarEstado = async (t: Trabajador, estado: "activo" | "pausado") => {
    try {
      const res = await fetch(`${API_URL}/trabajadores/${t.id}/locales/${t.local_id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ estado }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo cambiar el estado.");
      toast.success(estado === "pausado" ? `${t.nombre} en pausa en ${t.local_nombre}.` : `${t.nombre} activo de nuevo en ${t.local_nombre}.`);
      cargar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo cambiar el estado.");
    }
  };

  const otrosLocalesActivos = (t: Trabajador) =>
    lista.filter(x => x.id === t.id && x.local_id !== t.local_id && x.asignacion_estado === "activo").map(x => x.local_nombre);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Trabajadores</h1>
        <p className="text-muted-foreground">Quienes atienden. No necesitan cuenta: tú les atribuyes los servicios al cobrar.</p>
      </div>

      {can("trabajadores.administrar") && (
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-lg"><Plus className="h-5 w-5" aria-hidden /> Agregar trabajador</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={agregar} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label htmlFor="t-nombre">Nombre</Label><Input id="t-nombre" className="h-12 text-base" value={nombre} maxLength={255} onChange={e => setNombre(e.target.value)} /></div>
                <div><Label htmlFor="t-apellido">Apellido <span className="font-normal text-muted-foreground">(opcional)</span></Label><Input id="t-apellido" className="h-12 text-base" value={apellido} maxLength={255} onChange={e => setApellido(e.target.value)} /></div>
              </div>
              {locales.length > 1 && (
                <div>
                  <Label className="mb-1.5 block">¿En qué local trabaja?</Label>
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Local del trabajador">
                    {locales.map(l => (
                      <button key={l.id} type="button" aria-pressed={localNuevo === l.id} onClick={() => setLocalNuevo(l.id)}
                        className={`min-h-[44px] cursor-pointer rounded-xl border px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${localNuevo === l.id ? "border-primary bg-primary text-primary-foreground" : "bg-white hover:bg-muted"}`}>{l.nombre}</button>
                    ))}
                  </div>
                </div>
              )}
              <Button type="submit" size="lg" disabled={guardando}>{guardando ? "Agregando..." : "Agregar trabajador"}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {locales.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por local">
          {[{ id: "todos", nombre: "Todos los locales" }, ...locales].map(l => (
            <button key={l.id} type="button" aria-pressed={filtroLocal === l.id} onClick={() => setFiltroLocal(l.id)}
              className={`min-h-[40px] cursor-pointer rounded-full border px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${filtroLocal === l.id ? "border-primary bg-primary text-primary-foreground" : "bg-white hover:bg-muted"}`}>{l.nombre}</button>
          ))}
        </div>
      )}

      {!cargando && visibles.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          <User className="h-6 w-6" aria-hidden /> Aún no hay trabajadores en este local.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visibles.map(t => {
          const pausado = t.asignacion_estado === "pausado";
          const tambien = otrosLocalesActivos(t);
          return (
            <Card key={`${t.id}-${t.local_id}`} className={`border border-border/60 shadow-sm ${pausado ? "opacity-80" : ""}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-lg">{nombreCompleto(t)}</CardTitle>
                    <p className="text-sm text-muted-foreground">{t.local_nombre}</p>
                  </div>
                  {pausado ? <Badge variant="outline" className="gap-1 font-normal"><PauseCircle className="h-3 w-3" aria-hidden /> En pausa</Badge> : <Badge>Activo</Badge>}
                </div>
                {pausado && <p className="text-xs text-muted-foreground">Ahora trabaja en {t.local_actual_nombre}</p>}
                {!pausado && tambien.length > 0 && <p className="text-xs text-muted-foreground">También trabaja en {tambien.join(", ")}</p>}
              </CardHeader>
              <CardContent className="space-y-4">
                <dl className="grid grid-cols-3 gap-2 rounded-xl bg-muted/50 p-3 text-center">
                  <div><dd className="text-lg font-bold tabular-nums">{t.servicios_mes}</dd><dt className="text-[11px] text-muted-foreground">Servicios del mes</dt></div>
                  <div><dd className="text-lg font-bold tabular-nums">{formatMoney(t.generado_mes)}</dd><dt className="text-[11px] text-muted-foreground">Vendió</dt></div>
                  <div><dd className="text-lg font-bold tabular-nums text-primary">{formatMoney(t.comision_mes)}</dd><dt className="text-[11px] text-muted-foreground">Su parte</dt></div>
                </dl>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setVerHistorial(t)}><History className="mr-1 h-4 w-4" aria-hidden /> Historial</Button>
                  {can("trabajadores.transferir") && !pausado && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setATransferir(t)}><ArrowLeftRight className="mr-1 h-4 w-4" aria-hidden /> Trasladar</Button>
                      <Button size="sm" variant="outline" onClick={() => setAAgregar(t)}><MapPinPlus className="mr-1 h-4 w-4" aria-hidden /> También en…</Button>
                    </>
                  )}
                  {can("trabajadores.transferir") && (
                    pausado
                      ? <Button size="sm" variant="outline" onClick={() => cambiarEstado(t, "activo")}><PlayCircle className="mr-1 h-4 w-4" aria-hidden /> Reanudar aquí</Button>
                      : tambien.length > 0 && <Button size="sm" variant="outline" onClick={() => cambiarEstado(t, "pausado")}><PauseCircle className="mr-1 h-4 w-4" aria-hidden /> Pausar aquí</Button>
                  )}
                  {can("trabajadores.administrar") && !pausado && (
                    <Button size="sm" variant="outline" onClick={() => eliminar(t)} aria-label={`Eliminar a ${nombreCompleto(t)}`}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <TransferirDialog trabajador={aTransferir} locales={locales} onClose={() => setATransferir(null)} onHecho={cargar} />
      <AgregarALocalDialog
        trabajador={aAgregar ? { id: aAgregar.id, nombre: aAgregar.nombre, apellido: aAgregar.apellido, yaEn: lista.filter(x => x.id === aAgregar.id && x.asignacion_estado === "activo").map(x => x.local_id) } : null}
        locales={locales} onClose={() => setAAgregar(null)} onHecho={cargar} />
      <HistorialDialog trabajador={verHistorial} onClose={() => setVerHistorial(null)} />
      {dialogo}
    </div>
  );
};

export default Trabajadores;
