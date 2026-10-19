import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { API_URL, formatMoney } from "@/lib/ventas";

interface TrabajadorBasico { id: string; nombre: string; apellido: string; local_actual_id: string; local_actual_nombre: string }
interface LocalBasico { id: string; nombre: string }

// ---------- Trasladar a otro local ----------
export function TransferirDialog({ trabajador, locales, onClose, onHecho }: {
  trabajador: TrabajadorBasico | null; locales: LocalBasico[]; onClose: () => void; onHecho: () => void;
}) {
  const [destino, setDestino] = useState("");
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => { setDestino(""); setMotivo(""); }, [trabajador?.id]);

  const opciones = locales.filter(l => l.id !== trabajador?.local_actual_id);

  const confirmar = async () => {
    if (!trabajador || !destino) return;
    setEnviando(true);
    try {
      const res = await fetch(`${API_URL}/trabajadores/${trabajador.id}/transferir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ local_destino: destino, motivo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo trasladar al trabajador.");
      toast.success(`${trabajador.nombre} ${trabajador.apellido} ahora trabaja en ${locales.find(l => l.id === destino)?.nombre}.`);
      onHecho();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo trasladar.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={!!trabajador} onOpenChange={o => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Trasladar a {trabajador?.nombre} {trabajador?.apellido}</DialogTitle>
          <DialogDescription>
            Su historial y estadísticas en <strong>{trabajador?.local_actual_nombre}</strong> quedan <strong>en pausa</strong> sin perderse
            y se reanudan si regresa. En el nuevo local empieza un historial independiente.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div>
            <Label>Local de destino</Label>
            <Select value={destino} onValueChange={setDestino}>
              <SelectTrigger><SelectValue placeholder="Elige el local" /></SelectTrigger>
              <SelectContent>
                {opciones.map(l => <SelectItem key={l.id} value={l.id}>{l.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
            {opciones.length === 0 && <p className="mt-1 text-xs text-muted-foreground">No hay otros locales disponibles.</p>}
          </div>
          <div>
            <Label htmlFor="traslado-motivo">Motivo (opcional)</Label>
            <Input id="traslado-motivo" value={motivo} maxLength={255} onChange={e => setMotivo(e.target.value)} placeholder="Ej.: cubre vacaciones, refuerzo de temporada" />
          </div>
          <p className="text-xs text-muted-foreground">
            Si solo cubre otro local por momentos, mejor usa «También trabaja en…»: sigue activo en este local y también puede recibir cobros en el otro.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={confirmar} disabled={!destino || enviando}>
            <ArrowRight className="mr-1 h-4 w-4" aria-hidden /> {enviando ? "Trasladando..." : "Trasladar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Historial por local ----------
interface Historial {
  trabajador: { id: string; nombre: string };
  locales: { local_id: string; local_nombre: string; estado: string; desde: string; actualizado: string; servicios: number; generado: number; comision: number; ultimo_servicio: string | null }[];
  movimientos: { fecha: string; origen: string | null; destino: string; motivo: string; usuario: string }[];
}

export function HistorialDialog({ trabajador, onClose }: { trabajador: { id: string; nombre: string; apellido: string } | null; onClose: () => void }) {
  const [data, setData] = useState<Historial | null>(null);

  useEffect(() => {
    if (!trabajador) return;
    setData(null);
    fetch(`${API_URL}/trabajadores/${trabajador.id}/historial`)
      .then(async r => { const b = await r.json(); if (!r.ok) throw new Error(b.message); return b; })
      .then(setData)
      .catch(e => { toast.error(e.message || "No se pudo cargar el historial."); onClose(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trabajador?.id]);

  return (
    <Dialog open={!!trabajador} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><History className="h-5 w-5" aria-hidden /> Historial de {trabajador?.nombre} {trabajador?.apellido}</DialogTitle>
          <DialogDescription>Cada local tiene su propio historial: las cifras no se mezclan al trasladarlo.</DialogDescription>
        </DialogHeader>
        {!data ? <p className="py-6 text-center text-sm text-muted-foreground">Cargando…</p> : (
          <div className="space-y-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Local</TableHead><TableHead>Estado</TableHead><TableHead>Desde</TableHead>
                  <TableHead className="text-right">Servicios</TableHead><TableHead className="text-right">Vendió</TableHead><TableHead className="text-right">Su parte</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.locales.map(l => (
                  <TableRow key={l.local_id}>
                    <TableCell className="font-medium">{l.local_nombre}</TableCell>
                    <TableCell>{l.estado === "activo" ? <Badge>Activo</Badge> : <Badge variant="outline">En pausa</Badge>}</TableCell>
                    <TableCell className="tabular-nums">{l.desde}</TableCell>
                    <TableCell className="text-right tabular-nums">{l.servicios}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(l.generado)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(l.comision)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div>
              <h3 className="mb-2 text-sm font-semibold">Traslados</h3>
              {data.movimientos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nunca ha sido trasladado.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {data.movimientos.map((m, i) => (
                    <li key={i} className="rounded-lg border p-3">
                      <p className="font-medium">{m.origen ?? "—"} <ArrowRight className="mx-1 inline h-3.5 w-3.5" aria-hidden /> {m.destino}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">{m.fecha} · por {m.usuario}{m.motivo ? ` · ${m.motivo}` : ""}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


// ---------- También trabaja en otro local (sin pausar el actual) ----------
export function AgregarALocalDialog({ trabajador, locales, onClose, onHecho }: {
  trabajador: { id: string; nombre: string; apellido: string; yaEn: string[] } | null; locales: LocalBasico[]; onClose: () => void; onHecho: () => void;
}) {
  const [enviando, setEnviando] = useState<string | null>(null);
  const opciones = locales.filter(l => !trabajador?.yaEn.includes(l.id));

  const agregar = async (local: LocalBasico) => {
    if (!trabajador) return;
    setEnviando(local.id);
    try {
      const res = await fetch(`${API_URL}/trabajadores/${trabajador.id}/locales`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ local_id: local.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo agregar.");
      toast.success(`${trabajador.nombre} también trabaja en ${local.nombre}.`);
      onHecho();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo agregar.");
    } finally {
      setEnviando(null);
    }
  };

  return (
    <Dialog open={!!trabajador} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{trabajador?.nombre} también trabaja en…</DialogTitle>
          <DialogDescription>Seguirá activo donde está y aparecerá al cobrar en el otro local. Cada local lleva sus propias cifras.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {opciones.map(l => (
            <Button key={l.id} variant="outline" className="h-12 justify-start" disabled={enviando !== null} onClick={() => agregar(l)}>
              {enviando === l.id ? "Agregando..." : l.nombre}
            </Button>
          ))}
          {opciones.length === 0 && <p className="text-sm text-muted-foreground">Ya trabaja en todos los locales.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
