// src/components/ClientIntake.tsx
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from "date-fns"; // Importar format de date-fns


// Definir la interfaz para un Servicio (AJUSTADA: SIN popularidad, ingresosMes, clientesMes)
interface Servicio {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  duracion: string;
  descripcion: string;
  local_id: number;
  local_nombre?: string;
}

// Definir la interfaz para un Trabajador
interface Trabajador {
  id: number;
  nombre: string;
  apellido: string;
  especialidad: string;
  servicios: string[]; // Array de nombres de servicios que realiza
  local_id: number;
}

// Definir la interfaz para un Local
interface Local {
  id: number;
  nombre: string;
}

const ClientIntake = () => {
  const { userRole, localId: authLocalId } = useAuth();

  // Obtener fecha y hora actuales para inicialización
  const now = new Date();
  const initialDate = format(now, "yyyy-MM-dd");
  const initialTime = format(now, "HH:mm");

  const [clienteData, setClienteData] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
    fechaCita: initialDate, // Automática
    horaCita: initialTime,   // Automática
    servicioId: "",
    trabajadorId: "any_worker", // Valor por defecto no vacío
    notas: "",
    localId: userRole === 'encargado' && authLocalId ? authLocalId.toString() : ""
  });

  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [locales, setLocales] = useState<Local[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const resLocales = await fetch('http://localhost:3001/api/locales');
        if (!resLocales.ok) throw new Error(`Error al cargar locales: ${resLocales.statusText}`);
        const dataLocales: Local[] = await resLocales.json();
        setLocales(dataLocales.map(l => ({ id: l.id, nombre: l.nombre })));

        let serviciosUrl = 'http://localhost:3001/api/servicios';
        if (userRole === 'encargado' && authLocalId) {
          serviciosUrl += `?local_id=${authLocalId}`;
        }
        const resServicios = await fetch(serviciosUrl);
        if (!resServicios.ok) throw new Error(`Error al cargar servicios: ${resServicios.statusText}`);
        const dataServicios: Servicio[] = await resServicios.json();
        setServicios(dataServicios);

        let trabajadoresUrl = 'http://localhost:3001/api/trabajadores';
        if (userRole === 'encargado' && authLocalId) {
          trabajadoresUrl += `?local_id=${authLocalId}`;
        }
        const resTrabajadores = await fetch(trabajadoresUrl);
        if (!resTrabajadores.ok) throw new Error(`Error al cargar trabajadores: ${resTrabajadores.statusText}`);
        const dataTrabajadores: Trabajador[] = await resTrabajadores.json();
        setTrabajadores(dataTrabajadores);

      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "Error al cargar los datos. Por favor, inténtalo de nuevo.");
        toast.error("Error de carga", {
          description: "No se pudieron obtener los datos del servidor."
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [userRole, authLocalId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setClienteData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setClienteData(prev => ({ ...prev, [id]: value }));
    if (id === "localId") {
      setClienteData(prev => ({ ...prev, servicioId: "", trabajadorId: "any_worker" }));
    }
  };

  const availableServicios = useMemo(() => {
    const currentLocalId = clienteData.localId ? parseInt(clienteData.localId, 10) : null;
    if (!currentLocalId) return [];
    return servicios.filter(s => s.local_id === currentLocalId);
  }, [servicios, clienteData.localId]);

  const availableTrabajadores = useMemo(() => {
    const currentLocalId = clienteData.localId ? parseInt(clienteData.localId, 10) : null;
    if (!currentLocalId) return [];
    
    let filtered = trabajadores.filter(t => t.local_id === currentLocalId);

    if (clienteData.servicioId) {
      const selectedServicio = servicios.find(s => s.id === parseInt(clienteData.servicioId, 10));
      if (selectedServicio) {
        filtered = filtered.filter(t => (t.servicios || []).includes(selectedServicio.nombre));
      }
    }
    return filtered;
  }, [trabajadores, servicios, clienteData.localId, clienteData.servicioId]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteData.nombre || !clienteData.servicioId || !clienteData.localId) {
      toast.error("Por favor, completa al menos el nombre del cliente, el servicio y el local.");
      return;
    }
    const finalTrabajadorId = clienteData.trabajadorId === "any_worker" ? "" : clienteData.trabajadorId;

    console.log("Datos del cliente para la cita:", { ...clienteData, trabajadorId: finalTrabajadorId });
    toast.success("Cita agendada", {
      description: `Cita para ${clienteData.nombre} ${clienteData.apellido || ''} el ${clienteData.fechaCita} a las ${clienteData.horaCita} para el servicio ${servicios.find(s => s.id === parseInt(clienteData.servicioId))?.nombre || ''} en el local ${locales.find(l => l.id === parseInt(clienteData.localId))?.nombre || ''}.`
    });
    setClienteData({
      nombre: "",
      apellido: "",
      telefono: "",
      email: "",
      fechaCita: initialDate,
      horaCita: initialTime,
      servicioId: "",
      trabajadorId: "any_worker",
      notas: "",
      localId: userRole === 'encargado' && authLocalId ? authLocalId.toString() : ""
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Registro de Citas</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-10 w-full mt-6" />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-stylepro-lavender-50/30 to-stylepro-blue-50/20">
      <div className="container mx-auto px-6 py-8 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Registro de Citas</h1>
          <p className="text-muted-foreground">Agenda nuevas citas para tus clientes.</p>
        </div>

        <Card className="p-6 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Datos del Cliente y Cita</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sección de Datos del Cliente */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-stylepro-blue-800">Información del Cliente</h3>
                <div>
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input id="nombre" value={clienteData.nombre} onChange={handleInputChange} required />
                </div>
                <div>
                  <Label htmlFor="apellido">Apellido</Label>
                  <Input id="apellido" value={clienteData.apellido} onChange={handleInputChange} />
                </div>
              </div>

              <Separator orientation="vertical" className="hidden md:block" />
              <Separator orientation="horizontal" className="block md:hidden" />

              {/* Sección de Detalles de la Cita */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-stylepro-lavender-800">Detalles de la Cita</h3>
                {/* Selector de Local */}
                <div>
                  <Label htmlFor="localId">Local</Label>
                  {userRole === 'admin' ? (
                    <Select value={clienteData.localId} onValueChange={(value) => handleSelectChange("localId", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar local" />
                      </SelectTrigger>
                      <SelectContent>
                        {locales.map(local => (
                          <SelectItem key={local.id} value={local.id.toString()}>{local.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="localNameDisplay"
                      value={locales.find(l => l.id.toString() === authLocalId)?.nombre || 'Cargando...'}
                      disabled
                    />
                  )}
                </div>

                {/* Selector de Servicio */}
                <div>
                  <Label htmlFor="servicioId">Servicio</Label>
                  <Select value={clienteData.servicioId} onValueChange={(value) => handleSelectChange("servicioId", value)} disabled={!clienteData.localId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableServicios.length > 0 ? (
                        availableServicios.map(servicio => (
                          <SelectItem key={servicio.id} value={servicio.id.toString()}>
                            {servicio.nombre} (S/{servicio.precio.toFixed(2)})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-services-available" disabled>No hay servicios disponibles para este local.</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Selector de Trabajador */}
                <div>
                  <Label htmlFor="trabajadorId">Trabajador (Opcional)</Label>
                  <Select value={clienteData.trabajadorId} onValueChange={(value) => handleSelectChange("trabajadorId", value)} disabled={!clienteData.localId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar trabajador" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any_worker">Cualquiera</SelectItem>
                      {availableTrabajadores.length > 0 ? (
                        availableTrabajadores.map(trabajador => (
                          <SelectItem key={trabajador.id} value={trabajador.id.toString()}>
                            {trabajador.nombre} {trabajador.apellido} ({trabajador.especialidad})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-workers-available" disabled>No hay trabajadores disponibles para este local o servicio.</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Fecha y Hora Automáticas */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fechaCita">Fecha de Cita</Label>
                    <Input id="fechaCita" value={clienteData.fechaCita} type="date" readOnly disabled />
                  </div>
                  <div>
                    <Label htmlFor="horaCita">Hora de Cita</Label>
                    <Input id="horaCita" value={clienteData.horaCita} type="time" readOnly disabled />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="notas">Notas Adicionales</Label>
                  <Input id="notas" value={clienteData.notas} onChange={handleInputChange} />
                </div>
              </div>

              <div className="md:col-span-2 mt-6">
                <Button type="submit" className="w-full bg-stylepro-gold-500 hover:bg-stylepro-gold-600">
                  Agendar Cita
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientIntake;