import { useEffect, useState } from "react";
import { toast } from "sonner";
import { KeyRound, Palette, Settings, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useBrand } from "@/hooks/useBrand";
import { API_URL } from "@/lib/ventas";
import { AparienciaTab } from "@/components/config/AparienciaTab";
import { RolesTab } from "@/components/config/RolesTab";
import { UsuariosTab } from "@/components/config/UsuariosTab";

interface Config { nombre_negocio: string; email: string; telefono: string; direccion: string }

const Configuraciones = () => {
  const { can } = useAuth();
  const { refrescar } = useBrand();
  const puedeEditar = can("configuracion.administrar");
  const puedeUsuarios = can("usuarios.administrar");

  const [config, setConfig] = useState<Config>({ nombre_negocio: "", email: "", telefono: "", direccion: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/configuracion`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(setConfig)
      .catch(() => toast.error("No se pudo cargar la configuración."));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/configuracion`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo guardar.");
      setConfig(data);
      refrescar(); // el nombre del negocio se ve en la barra lateral y el login
      toast.success("Configuración guardada.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  const campo = (id: keyof Config, label: string, type = "text") => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={config[id]} maxLength={255} disabled={!puedeEditar}
        onChange={e => setConfig(c => ({ ...c, [id]: e.target.value }))} />
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-1">Configuraciones</h1>
        <p className="text-muted-foreground">Datos del negocio, apariencia, roles y usuarios.</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="h-auto flex-wrap justify-start">
          <TabsTrigger value="general" className="gap-2"><Settings className="h-4 w-4" aria-hidden /> General</TabsTrigger>
          {puedeEditar && <TabsTrigger value="apariencia" className="gap-2"><Palette className="h-4 w-4" aria-hidden /> Apariencia</TabsTrigger>}
          {puedeUsuarios && <TabsTrigger value="roles" className="gap-2"><KeyRound className="h-4 w-4" aria-hidden /> Roles y permisos</TabsTrigger>}
          {puedeUsuarios && <TabsTrigger value="usuarios" className="gap-2"><Users className="h-4 w-4" aria-hidden /> Usuarios</TabsTrigger>}
        </TabsList>

        <TabsContent value="general">
          <Card className="border border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Información del negocio</CardTitle>
              <CardDescription>Estos datos se guardan en la base de datos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campo("nombre_negocio", "Nombre del negocio")}
                {campo("email", "Email principal", "email")}
                {campo("telefono", "Teléfono")}
                {campo("direccion", "Dirección")}
              </div>
              {puedeEditar ? (
                <Button onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</Button>
              ) : (
                <p className="text-sm text-muted-foreground">Solo el administrador puede modificar estos datos.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {puedeEditar && <TabsContent value="apariencia"><AparienciaTab /></TabsContent>}
        {puedeUsuarios && <TabsContent value="roles"><RolesTab /></TabsContent>}
        {puedeUsuarios && <TabsContent value="usuarios"><UsuariosTab /></TabsContent>}
      </Tabs>
    </div>
  );
};

export default Configuraciones;
