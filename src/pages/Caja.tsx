import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Banknote, CalendarDays, Check, Pencil, Receipt, Trash2, Undo2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PrecioDialog } from "@/components/PrecioDialog";
import { useAuth } from "@/hooks/useAuth";
import { useConfirmar } from "@/hooks/useConfirmar";
import {
  API_URL, METODOS_PAGO, Venta, ayerStr, fechaStr, formatHora, formatMoney, textoReparto, todayStr,
} from "@/lib/ventas";

interface Servicio { id: string; nombre: string; precio: number; porcentaje_trabajador: number; local_id: string }
interface Trabajador { id: string; nombre: string; apellido: string; local_id: string; asignacion_estado: string }
interface Linea { key: number; servicio: Servicio; precio: number; trabajador_id: string | null }

const nombreCompleto = (t: { nombre: string; apellido: string }) => `${t.nombre} ${t.apellido}`.trim();

// Botón grande y táctil reutilizable para elegir (local, trabajador, método de pago...)
function Opcion({ activo, onClick, children, className = "" }: { activo: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button type="button" aria-pressed={activo} onClick={onClick}
      className={`min-h-[76px] cursor-pointer rounded-2xl border-2 px-5 text-left text-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        activo ? "border-primary bg-primary text-primary-foreground shadow-sm" : "bg-white hover:bg-muted"} ${className}`}>
      {children}
    </button>
  );
}

// Cobrar: el dueño o la encargada recibe el ticket físico y anota local, servicios, precio y quién lo hizo.
const Caja = () => {
  const { localesPermitidos: locales, localId: authLocalId, can } = useAuth();
  const { confirmar, dialogo } = useConfirmar();
  const [localId, setLocalId] = useState<string>(locales.find(l => l.id === authLocalId)?.id ?? locales[0]?.id ?? "");

  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [trabajadorSel, setTrabajadorSel] = useState<string | null>(null);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [metodo, setMetodo] = useState("efectivo");
  const [modoFecha, setModoFecha] = useState<"hoy" | "ayer" | "otra">("hoy");
  const [fechaOtra, setFechaOtra] = useState<Date | undefined>();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [enviando, setEnviando] = useState(false);

  const [editandoPrecio, setEditandoPrecio] = useState<number | null>(null);
  const [eligiendoTrabajador, setEligiendoTrabajador] = useState<number | null>(null);
  const contador = useRef(0);

  const fecha = modoFecha === "hoy" ? todayStr() : modoFecha === "ayer" ? ayerStr() : fechaOtra ? fechaStr(fechaOtra) : todayStr();
  const total = useMemo(() => Math.round(lineas.reduce((a, l) => a + l.precio, 0) * 100) / 100, [lineas]);
  const faltaTrabajador = lineas.some(l => !l.trabajador_id);
  const trabajadorDe = (id: string | null) => trabajadores.find(t => t.id === id);

  // Al cambiar de local se empieza de cero
  useEffect(() => {
    setLineas([]);
    setTrabajadorSel(null);
    if (!localId) return;
    fetch(`${API_URL}/servicios?local_id=${localId}`).then(r => (r.ok ? r.json() : Promise.reject())).then(setServicios)
      .catch(() => toast.error("No se pudieron cargar los servicios."));
    fetch(`${API_URL}/trabajadores?local_id=${localId}`).then(r => (r.ok ? r.json() : Promise.reject()))
      .then((ts: Trabajador[]) => setTrabajadores(ts.filter(t => t.local_id === localId && t.asignacion_estado === "activo")))
      .catch(() => toast.error("No se pudieron cargar los trabajadores."));
  }, [localId]);

  const cargarVentas = useCallback(async () => {
    if (!localId) return;
    try {
      const r = await fetch(`${API_URL}/ventas?local_id=${localId}&fecha=${fecha}`);
      if (r.ok) setVentas(await r.json());
    } catch { /* se reintenta en la siguiente acción */ }
  }, [localId, fecha]);
  useEffect(() => { cargarVentas(); }, [cargarVentas]);

  const elegirTrabajador = (id: string) => {
    setTrabajadorSel(id);
    // Los servicios ya anotados sin responsable pasan a este trabajador
    setLineas(ls => ls.map(l => (l.trabajador_id ? l : { ...l, trabajador_id: id })));
  };

  const agregar = (s: Servicio) =>
    setLineas(ls => [...ls, { key: ++contador.current, servicio: s, precio: s.precio, trabajador_id: trabajadorSel }]);
  const quitar = (key: number) => {
    const idx = lineas.findIndex(l => l.key === key);
    const linea = lineas[idx];
    if (!linea) return;
    setLineas(ls => ls.filter(l => l.key !== key));
    toast(`«${linea.servicio.nombre}» quitado de la cuenta`, {
      action: { label: "Deshacer", onClick: () => setLineas(ls => { const copia = [...ls]; copia.splice(Math.min(idx, copia.length), 0, linea); return copia; }) },
      duration: 5000,
    });
  };

  const vaciar = async () => {
    if (!(await confirmar({ titulo: "¿Vaciar la cuenta?", descripcion: `Se quitarán los ${lineas.length} servicios anotados (${formatMoney(total)}). Aún no se ha cobrado nada.`, textoConfirmar: "Sí, vaciar", destructivo: true }))) return;
    setLineas([]);
  };

  const anular = async (v: Venta, silencioso = false) => {
    try {
      const res = await fetch(`${API_URL}/ventas/${v.id}/anular`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo anular.");
      if (!silencioso) toast.info("Venta anulada.");
      else toast.info("Cobro deshecho.");
      cargarVentas();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo anular.");
    }
  };

  const cobrar = async () => {
    if (lineas.length === 0) return;
    if (faltaTrabajador) { toast.error("Elige quién hizo cada servicio."); return; }
    setEnviando(true);
    try {
      const res = await fetch(`${API_URL}/ventas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          local_id: localId, metodo_pago: metodo, ...(modoFecha !== "hoy" ? { fecha } : {}),
          items: lineas.map(l => ({ servicio_id: l.servicio.id, trabajador_id: l.trabajador_id, precio: l.precio })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo registrar el cobro.");
      toast.success(`Cobrado ${formatMoney(data.total)}`, {
        description: data.items.map((i: Venta["items"][number]) => `${i.servicio_nombre} · ${i.trabajador_nombre}`).join(" + "),
        action: { label: "Deshacer", onClick: () => anular(data, true) },
        duration: 8000,
      });
      setLineas([]);
      setTrabajadorSel(null);
      cargarVentas();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo registrar el cobro.");
    } finally {
      setEnviando(false);
    }
  };

  const activas = ventas.filter(v => v.estado === "activa");
  const totalDia = activas.reduce((a, v) => a + v.total, 0);
  const lineaPrecio = lineas.find(l => l.key === editandoPrecio);
  const nombreLocal = locales.find(l => l.id === localId)?.nombre;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Cobrar</h1>
        <p className="text-muted-foreground">Recibe el ticket del cliente y anota lo que se hizo.</p>
      </div>

      {locales.length === 0 && <p className="text-muted-foreground">Tu usuario no tiene locales asignados.</p>}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* ---------- Izquierda: elegir ---------- */}
        <div className="space-y-6">
          {locales.length > 1 && (
            <section aria-labelledby="t-local">
              <h2 id="t-local" className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">1 · ¿En qué local?</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {locales.map(l => <Opcion key={l.id} activo={localId === l.id} onClick={() => setLocalId(l.id)}>{l.nombre}</Opcion>)}
              </div>
            </section>
          )}

          <section aria-labelledby="t-trab">
            <h2 id="t-trab" className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{locales.length > 1 ? "2" : "1"} · ¿Quién lo atendió?</h2>
            {trabajadores.length === 0 ? (
              <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Este local aún no tiene trabajadores. Agrégalos en la sección Trabajadores.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                {trabajadores.map(t => (
                  <Opcion key={t.id} activo={trabajadorSel === t.id} onClick={() => elegirTrabajador(t.id)}>
                    <span className="flex items-center gap-3">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-bold ${trabajadorSel === t.id ? "bg-white/25" : "bg-stylepro-lavender-100 text-stylepro-lavender-700"}`} aria-hidden>{t.nombre.charAt(0).toUpperCase()}</span>
                      <span className="leading-tight break-words">{nombreCompleto(t)}</span>
                    </span>
                  </Opcion>
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="t-serv">
            <h2 id="t-serv" className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{locales.length > 1 ? "3" : "2"} · ¿Qué servicio se hizo?</h2>
            {servicios.length === 0 ? (
              <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Este local aún no tiene servicios. {can("servicios.administrar") ? "Agrégalos en Servicios y precios." : "Pídele al dueño que los agregue."}</p>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {servicios.map(s => (
                    <button key={s.id} type="button" onClick={() => agregar(s)}
                      className="flex min-h-[128px] cursor-pointer flex-col justify-between rounded-2xl border-2 bg-white p-4 text-left transition-colors hover:border-primary/50 hover:bg-stylepro-lavender-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <span className="text-lg font-semibold leading-tight">{s.nombre}</span>
                      <span className="text-3xl font-bold tabular-nums text-primary">{formatMoney(s.precio)}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Toca varios para sumarlos en el mismo cobro (por ejemplo corte + perfilado).</p>
              </>
            )}
          </section>
        </div>

        {/* ---------- Derecha: la cuenta ---------- */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card className="border border-border/60 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg"><Receipt className="h-5 w-5" aria-hidden /> Cuenta {nombreLocal && <span className="text-sm font-normal text-muted-foreground">· {nombreLocal}</span>}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lineas.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Toca un servicio para empezar.</p>
              ) : (
                <ul className="space-y-2">
                  {lineas.map(l => {
                    const t = trabajadorDe(l.trabajador_id);
                    return (
                      <li key={l.key} className="rounded-xl border p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-base font-semibold leading-tight">{l.servicio.nombre}</p>
                          <button type="button" onClick={() => quitar(l.key)} aria-label={`Quitar ${l.servicio.nombre} de la cuenta`}
                            className="inline-flex min-h-[40px] shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-sm font-medium text-red-700 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400">
                            <Trash2 className="h-4 w-4" aria-hidden /> Quitar
                          </button>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <button type="button" onClick={() => setEligiendoTrabajador(l.key)}
                            className={`inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${t ? "bg-muted hover:bg-muted/70" : "border-red-300 bg-red-50 text-red-700"}`}>
                            <User className="h-3.5 w-3.5" aria-hidden /> {t ? nombreCompleto(t) : "Elegir quién lo hizo"}
                          </button>
                          <button type="button" onClick={() => setEditandoPrecio(l.key)} aria-label={`Cambiar el precio de ${l.servicio.nombre}`}
                            className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-base font-bold tabular-nums hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            {formatMoney(l.precio)} <Pencil className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                          </button>
                        </div>
                        {l.precio !== l.servicio.precio && <p className="mt-1 text-xs text-muted-foreground">Precio ajustado (original {formatMoney(l.servicio.precio)})</p>}
                      </li>
                    );
                  })}
                </ul>
              )}
              {lineas.length > 1 && (
                <button type="button" onClick={vaciar}
                  className="inline-flex min-h-[40px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg border text-sm font-medium text-muted-foreground hover:bg-muted hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Undo2 className="h-4 w-4" aria-hidden /> Vaciar toda la cuenta
                </button>
              )}

              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Pago</p>
                <div className="grid grid-cols-4 gap-2">
                  {METODOS_PAGO.map(m => (
                    <button key={m.value} type="button" aria-pressed={metodo === m.value} onClick={() => setMetodo(m.value)}
                      className={`min-h-[40px] cursor-pointer rounded-lg border text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${metodo === m.value ? "border-primary bg-primary text-primary-foreground" : "bg-white hover:bg-muted"}`}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Fecha</p>
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" aria-pressed={modoFecha === "hoy"} onClick={() => setModoFecha("hoy")}
                    className={`min-h-[40px] cursor-pointer rounded-lg border text-sm font-medium ${modoFecha === "hoy" ? "border-primary bg-primary text-primary-foreground" : "bg-white hover:bg-muted"}`}>Hoy</button>
                  <button type="button" aria-pressed={modoFecha === "ayer"} onClick={() => setModoFecha("ayer")}
                    className={`min-h-[40px] cursor-pointer rounded-lg border text-sm font-medium ${modoFecha === "ayer" ? "border-primary bg-primary text-primary-foreground" : "bg-white hover:bg-muted"}`}>Ayer</button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" aria-pressed={modoFecha === "otra"}
                        className={`inline-flex min-h-[40px] cursor-pointer items-center justify-center gap-1 rounded-lg border text-sm font-medium ${modoFecha === "otra" ? "border-primary bg-primary text-primary-foreground" : "bg-white hover:bg-muted"}`}>
                        <CalendarDays className="h-4 w-4" aria-hidden /> {modoFecha === "otra" && fechaOtra ? format(fechaOtra, "d MMM", { locale: es }) : "Otra"}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar mode="single" selected={fechaOtra} disabled={{ after: new Date() }}
                        onSelect={d => { if (d) { setFechaOtra(d); setModoFecha("otra"); } }} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex items-end justify-between border-t pt-4">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-4xl font-bold tabular-nums">{formatMoney(total)}</span>
              </div>
              <Button size="lg" className="h-14 w-full text-lg" disabled={lineas.length === 0 || enviando || !localId} onClick={cobrar}>
                <Banknote className="mr-2 h-5 w-5" aria-hidden /> {enviando ? "Registrando..." : lineas.length ? `Cobrar ${formatMoney(total)}` : "Cobrar"}
              </Button>
              {faltaTrabajador && lineas.length > 0 && <p className="text-center text-xs text-red-700" role="alert">Falta elegir quién hizo algún servicio.</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ---------- Ventas del día ---------- */}
      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
            <span>Cobros del {modoFecha === "hoy" ? "día" : fecha}{nombreLocal ? ` · ${nombreLocal}` : ""}</span>
            <span className="text-xl font-bold tabular-nums">{formatMoney(totalDia)}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ventas.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Aún no hay cobros este día.</p>
          ) : (
            <ul className="divide-y">
              {ventas.map(v => (
                <li key={v.id} className={`flex flex-wrap items-center justify-between gap-3 py-3 ${v.estado === "anulada" ? "opacity-50" : ""}`}>
                  <div className="min-w-0">
                    <p className={`font-medium ${v.estado === "anulada" ? "line-through" : ""}`}>
                      {v.items.map(i => i.servicio_nombre).join(" + ")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatHora(v.fecha_hora)} · {[...new Set(v.items.map(i => i.trabajador_nombre))].join(", ")} · <span className="capitalize">{v.metodo_pago}</span>
                      {v.estado === "anulada" && <Badge variant="outline" className="ml-2">Anulada</Badge>}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold tabular-nums">{formatMoney(v.total)}</span>
                    {v.estado === "activa" && can("ventas.anular") && (
                      <Button size="sm" variant="outline" onClick={async () => {
                        if (await confirmar({
                          titulo: "¿Anular este cobro?",
                          descripcion: `${v.items.map(i => i.servicio_nombre).join(" + ")} · ${formatMoney(v.total)}. Dejará de contar en los reportes.`,
                          textoConfirmar: "Sí, anular", destructivo: true,
                        })) anular(v);
                      }}>Anular</Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Barra de cobro fija en pantallas angostas (tablet vertical, celular) */}
      {lineas.length > 0 && (
        <div className="sticky bottom-0 z-20 -mx-4 border-t bg-white/95 p-3 backdrop-blur lg:hidden md:-mx-6">
          <Button size="lg" className="h-14 w-full text-lg" disabled={enviando} onClick={cobrar}>
            <Check className="mr-2 h-5 w-5" aria-hidden /> Cobrar {formatMoney(total)} · {lineas.length} servicio{lineas.length === 1 ? "" : "s"}
          </Button>
        </div>
      )}

      {dialogo}

      {/* Ajustar precio con teclado numérico */}
      <PrecioDialog
        abierto={editandoPrecio !== null}
        titulo={lineaPrecio ? lineaPrecio.servicio.nombre : ""}
        precioActual={lineaPrecio?.precio ?? 0}
        precioOriginal={lineaPrecio?.servicio.precio ?? 0}
        onCerrar={() => setEditandoPrecio(null)}
        onConfirmar={p => { setLineas(ls => ls.map(l => (l.key === editandoPrecio ? { ...l, precio: p } : l))); setEditandoPrecio(null); }}
      />

      {/* Cambiar quién hizo un servicio */}
      <Dialog open={eligiendoTrabajador !== null} onOpenChange={o => !o && setEligiendoTrabajador(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Quién hizo este servicio?</DialogTitle>
            <DialogDescription>{lineas.find(l => l.key === eligiendoTrabajador)?.servicio.nombre}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {trabajadores.map(t => (
              <Opcion key={t.id} activo={lineas.find(l => l.key === eligiendoTrabajador)?.trabajador_id === t.id}
                onClick={() => { setLineas(ls => ls.map(l => (l.key === eligiendoTrabajador ? { ...l, trabajador_id: t.id } : l))); setEligiendoTrabajador(null); }}>
                {nombreCompleto(t)}
              </Opcion>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">El reparto de este servicio es: {(() => { const l = lineas.find(x => x.key === eligiendoTrabajador); return l ? textoReparto(l.servicio.porcentaje_trabajador) : ""; })()}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Caja;
