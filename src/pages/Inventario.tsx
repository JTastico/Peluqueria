import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, BarChart3, Minus, Package, Pencil, Plus, Trash2, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { useConfirmar } from "@/hooks/useConfirmar";
import { API_URL, formatMoney } from "@/lib/ventas";

type Estado = "Disponible" | "Bajo" | "Crítico" | "Agotado";

interface Producto {
  id: string;
  local_id: string;
  nombre: string;
  stock: number;
  stock_minimo: number;
  precio: number;
  estado: Estado;
}

const EMPTY = { nombre: "", stock: "", stock_minimo: "", precio: "" };

const ESTADO_BADGE: Record<Estado, JSX.Element> = {
  Disponible: <Badge className="bg-green-500 hover:bg-green-600">Disponible</Badge>,
  Bajo: <Badge className="bg-stylepro-gold-500 hover:bg-stylepro-gold-600">Bajo stock</Badge>,
  Crítico: <Badge className="bg-red-500 hover:bg-red-600">Crítico</Badge>,
  Agotado: <Badge variant="destructive">Agotado</Badge>,
};

const ESTADO_BAR: Record<Estado, string> = {
  Disponible: "bg-green-500", Bajo: "bg-stylepro-gold-500", Crítico: "bg-red-500", Agotado: "bg-gray-500",
};

const nivel = (stock: number, minimo: number) => {
  const max = Math.max(stock, minimo * 3, 1);
  return Math.min((stock / max) * 100, 100);
};

const Inventario = () => {
  const { localesPermitidos: locales, localId: authLocalId } = useAuth();
  const { confirmar, dialogo } = useConfirmar();
  const [localId, setLocalId] = useState<string>(
    locales.find(l => l.id === authLocalId)?.id ?? locales[0]?.id ?? ""
  );
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Producto | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!localId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/productos?local_id=${localId}`);
      if (!res.ok) throw new Error();
      setProductos(await res.json());
    } catch {
      toast.error("No se pudo cargar el inventario.");
    } finally {
      setLoading(false);
    }
  }, [localId]);

  useEffect(() => { load(); }, [load]);

  const resumen = useMemo(() => ({
    total: productos.length,
    bajos: productos.filter(p => p.estado === "Bajo" || p.estado === "Crítico").length,
    agotados: productos.filter(p => p.estado === "Agotado").length,
    valor: productos.reduce((sum, p) => sum + p.stock * p.precio, 0),
  }), [productos]);

  const openNew = () => { setEditing(null); setForm(EMPTY); setDialogOpen(true); };
  const openEdit = (p: Producto) => {
    setEditing(p);
    setForm({ nombre: p.nombre, stock: String(p.stock), stock_minimo: String(p.stock_minimo), precio: String(p.precio) });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) { toast.error("El nombre del producto es obligatorio."); return; }
    setSaving(true);
    try {
      const body = {
        nombre: form.nombre, stock: Number(form.stock || 0),
        stock_minimo: Number(form.stock_minimo || 0), precio: Number(form.precio || 0),
        ...(editing ? {} : { local_id: localId }),
      };
      const res = await fetch(`${API_URL}/productos${editing ? `/${editing.id}` : ""}`, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo guardar el producto.");
      toast.success(editing ? "Producto actualizado." : "Producto agregado.");
      setDialogOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const ajustar = async (p: Producto, delta: number) => {
    try {
      const res = await fetch(`${API_URL}/productos/${p.id}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo ajustar el stock.");
      setProductos(prev => prev.map(x => (x.id === p.id ? data : x)));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const eliminar = async (p: Producto) => {
    if (!(await confirmar({ titulo: `¿Eliminar «${p.nombre}»?`, descripcion: "Se quita del inventario de este local.", textoConfirmar: "Sí, eliminar", destructivo: true }))) return;
    try {
      const res = await fetch(`${API_URL}/productos/${p.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).message || "No se pudo eliminar.");
      toast.success("Producto eliminado.");
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const stats = [
    { label: "Total productos", value: resumen.total, icon: Package, bg: "bg-stylepro-blue-100", fg: "text-stylepro-blue-600" },
    { label: "Stock bajo", value: resumen.bajos, icon: AlertTriangle, bg: "bg-stylepro-gold-100", fg: "text-stylepro-gold-600" },
    { label: "Agotados", value: resumen.agotados, icon: TrendingDown, bg: "bg-red-100", fg: "text-red-600" },
    { label: "Valor total", value: formatMoney(resumen.valor), icon: BarChart3, bg: "bg-stylepro-lavender-100", fg: "text-stylepro-lavender-600" },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Gestión de Inventario</h1>
          <p className="text-muted-foreground">Controla el stock de productos por local.</p>
        </div>
        <div className="flex items-end gap-3">
          {locales.length > 1 && (
            <div className="w-56">
              <Label>Local</Label>
              <Select value={localId} onValueChange={setLocalId}>
                <SelectTrigger><SelectValue placeholder="Selecciona un local" /></SelectTrigger>
                <SelectContent>
                  {locales.map(l => <SelectItem key={l.id} value={l.id}>{l.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button onClick={openNew} disabled={!localId}><Plus className="h-4 w-4 mr-1" /> Agregar producto</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label} className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.bg}`}><s.icon className={`h-5 w-5 ${s.fg}`} /></div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className={`border-0 shadow-md ${loading ? "opacity-60" : ""}`}>
        <CardHeader><CardTitle className="text-lg">Productos</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead className="text-center">Mínimo</TableHead>
                <TableHead className="text-center">Precio unit.</TableHead>
                <TableHead className="text-center">Nivel</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading && productos.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Este local aún no tiene productos.</TableCell></TableRow>
              )}
              {productos.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nombre}</TableCell>
                  <TableCell className="text-center">
                    <div className="inline-flex items-center gap-2">
                      <Button size="icon" variant="outline" className="h-7 w-7" disabled={p.stock === 0} onClick={() => ajustar(p, -1)} title="Restar 1"><Minus className="h-3 w-3" /></Button>
                      <span className="font-semibold w-8">{p.stock}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => ajustar(p, 1)} title="Sumar 1"><Plus className="h-3 w-3" /></Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{p.stock_minimo}</TableCell>
                  <TableCell className="text-center">{formatMoney(p.precio)}</TableCell>
                  <TableCell className="text-center w-40">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all duration-300 ${ESTADO_BAR[p.estado]}`}
                        style={{ width: `${nivel(p.stock, p.stock_minimo)}%` }} />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{ESTADO_BADGE[p.estado]}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(p)} title="Editar"><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => eliminar(p)} title="Eliminar"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar producto" : "Agregar producto"}</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="p-nombre">Nombre</Label>
              <Input id="p-nombre" value={form.nombre} maxLength={255} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="p-stock">Stock</Label>
                <Input id="p-stock" type="number" min="0" step="1" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="p-min">Mínimo</Label>
                <Input id="p-min" type="number" min="0" step="1" value={form.stock_minimo} onChange={e => setForm(f => ({ ...f, stock_minimo: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="p-precio">Precio (S/)</Label>
                <Input id="p-precio" type="number" min="0" step="0.01" value={form.precio} onChange={e => setForm(f => ({ ...f, precio: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {dialogo}
    </div>
  );
};

export default Inventario;
