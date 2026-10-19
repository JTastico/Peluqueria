import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { API_URL } from "@/lib/api";
import type { Rol } from "./RolesTab";

interface Usuario {
  id: string; username: string; role: string; rol_nombre: string; alcance: string;
  local_nombre: string | null; trabajador_nombre: string | null; locales_asignados: string[];
}

export function UsuariosTab() {
  const { user, localesPermitidos: locales } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  // Cambio pendiente de confirmar cuando el rol es de varios locales
  const [pendiente, setPendiente] = useState<{ usuario: Usuario; rol: Rol } | null>(null);
  const [elegidos, setElegidos] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [ru, rr] = await Promise.all([fetch(`${API_URL}/usuarios`), fetch(`${API_URL}/roles`)]);
      if (!ru.ok || !rr.ok) throw new Error();
      setUsuarios(await ru.json());
      setRoles((await rr.json()).roles);
    } catch {
      toast.error("No se pudieron cargar los usuarios.");
    }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const aplicar = async (u: Usuario, rol: string, locs: string[]) => {
    setGuardando(true);
    try {
      const res = await fetch(`${API_URL}/usuarios/${u.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rol, locales: locs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo cambiar el rol.");
      toast.success(`${u.username} ahora es ${roles.find(r => r.id === rol)?.nombre ?? rol}.`);
      setPendiente(null);
      cargar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cambiar el rol.");
      cargar();
    } finally {
      setGuardando(false);
    }
  };

  const cambiarRol = (u: Usuario, rolId: string) => {
    const rol = roles.find(r => r.id === rolId);
    if (!rol || rolId === u.role) return;
    if (rol.alcance === "multi") {
      setElegidos(u.locales_asignados);
      setPendiente({ usuario: u, rol });
    } else {
      aplicar(u, rolId, []);
    }
  };

  return (
    <Card className="border border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle>Usuarios del sistema</CardTitle>
        <CardDescription>
          Cada trabajador entra con su DNI como usuario. Cambia el rol de un usuario aquí; si el rol es de varios locales, elige a cuáles puede ingresar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead><TableHead>Trabajador</TableHead><TableHead>Local base</TableHead>
              <TableHead>Rol</TableHead><TableHead>Locales con acceso</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map(u => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">
                  {u.role === "admin" && <Shield className="mr-1 inline h-3.5 w-3.5 text-primary" aria-hidden />}
                  {u.username}
                  {u.id === user?.id && <Badge variant="outline" className="ml-2 font-normal">Tú</Badge>}
                </TableCell>
                <TableCell>{u.trabajador_nombre || "—"}</TableCell>
                <TableCell>{u.local_nombre || "—"}</TableCell>
                <TableCell>
                  <Select value={u.role} onValueChange={v => cambiarRol(u, v)} disabled={u.id === user?.id || guardando}>
                    <SelectTrigger className="w-52" aria-label={`Rol de ${u.username}`}><SelectValue /></SelectTrigger>
                    <SelectContent>{roles.map(r => <SelectItem key={r.id} value={r.id}>{r.nombre}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {u.alcance === "multi" ? (
                    <Button variant="outline" size="sm" onClick={() => { setElegidos(u.locales_asignados); setPendiente({ usuario: u, rol: roles.find(r => r.id === u.role)! }); }}>
                      {u.locales_asignados.length} local{u.locales_asignados.length === 1 ? "" : "es"} · editar
                    </Button>
                  ) : u.alcance === "global" ? <span className="text-sm text-muted-foreground">Todos</span>
                    : <span className="text-sm text-muted-foreground">Solo su local</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={!!pendiente} onOpenChange={o => !o && setPendiente(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Locales de {pendiente?.usuario.username}</DialogTitle>
            <DialogDescription>El rol «{pendiente?.rol.nombre}» llega a los locales que marques. Podrá elegir en cuál está cada día.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-1">
            {locales.map(l => (
              <label key={l.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-muted/60">
                <Checkbox checked={elegidos.includes(l.id)} onCheckedChange={v => setElegidos(es => (v === true ? [...es, l.id] : es.filter(x => x !== l.id)))} />
                <span className="text-sm">{l.nombre}</span>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendiente(null)}>Cancelar</Button>
            <Button disabled={elegidos.length === 0 || guardando} onClick={() => pendiente && aplicar(pendiente.usuario, pendiente.rol.id, elegidos)}>
              {guardando ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
