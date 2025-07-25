// src/pages/Clientes.tsx
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Calendar, User, MapPin, Scissors, Clock as ClockIcon, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useAuth } from '@/hooks/useAuth'; // Importar useAuth


// Definir la interfaz para un Cliente/Cita (debe coincidir con el backend)
interface ClienteCita {
  id: number;
  nombre: string;
  apellido?: string;
  fecha_cita: string; // Formato YYYY-MM-DD
  hora_cita: string;   // Formato HH:MM
  servicio_id: number;
  trabajador_id?: number;
  local_id: number;
  notas?: string;
  fecha_registro: string; // TIMESTAMP
  
  // Campos de JOIN para mostrar nombres
  local_nombre: string;
  servicio_nombre: string;
  trabajador_nombre?: string;
  trabajador_apellido?: string;
}

const Clientes = () => {
  const { userRole, localId: authLocalId } = useAuth(); // Obtener userRole y authLocalId

  const [clientes, setClientes] = useState<ClienteCita[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClientes = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let clientesUrl = 'http://localhost:3001/api/clientes';
        // CAMBIO CLAVE AQUÍ: Filtrar por local_id si el usuario es encargado
        if (userRole === 'encargado' && authLocalId) {
            clientesUrl += `?local_id=${authLocalId}`;
        }

        const response = await fetch(clientesUrl);
        if (!response.ok) {
          throw new Error(`Error al cargar clientes: ${response.statusText}`);
        }
        const data: ClienteCita[] = await response.json();
        setClientes(data);
      } catch (err: any) {
        console.error("Error fetching clientes:", err);
        setError(err.message || "Error al cargar los clientes. Por favor, inténtalo de nuevo.");
        toast.error("Error de carga", {
          description: "No se pudieron obtener los datos de clientes del servidor."
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchClientes();
  }, [userRole, authLocalId]); // Re-ejecutar si el rol o localId cambian

  const handleDelete = async (idToDelete: number) => {
    try {
      const response = await fetch(`http://localhost:3001/api/clientes/${idToDelete}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error al eliminar cita: ${errorData.message || response.statusText}`);
      }
      setClientes(prevClientes => prevClientes.filter(c => c.id !== idToDelete));
      toast.success("Cita eliminada correctamente.");
    } catch (err: any) {
      console.error("Error al eliminar cita:", err);
      toast.error("Error al eliminar cita", {
        description: err.message || "No se pudo eliminar la cita del servidor."
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Clientes y Citas</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Clientes y Citas Agendadas</h1>
          <p className="text-muted-foreground">Revisa el historial y las próximas citas de tus clientes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientes.length === 0 && !isLoading ? (
            <p className="col-span-full text-center text-muted-foreground">No hay citas registradas para este local o rol.</p>
          ) : (
            clientes.map((cliente) => (
              <Card key={cliente.id} className="shadow-md hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-3 relative">
                  <div className="absolute top-2 right-2">
                    <Button 
                      size="sm" 
                      variant="destructive"
                      className="h-8 w-8 p-0"
                      onClick={(e) => { e.stopPropagation(); handleDelete(cliente.id); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <User className="h-5 w-5" /> {cliente.nombre} {cliente.apellido}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Cita registrada el: {format(new Date(cliente.fecha_registro), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(cliente.fecha_cita), 'PPP', { locale: es })}</span>
                    <ClockIcon className="h-4 w-4 ml-4" />
                    <span>{cliente.hora_cita}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>Local: {cliente.local_nombre}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Scissors className="h-4 w-4" />
                    <span>Servicio: {cliente.servicio_nombre}</span>
                  </div>
                  {cliente.trabajador_nombre && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Award className="h-4 w-4" />
                      <span>Trabajador: {cliente.trabajador_nombre} {cliente.trabajador_apellido}</span>
                    </div>
                  )}
                  {cliente.notas && (
                    <div className="text-sm text-muted-foreground italic mt-2">
                      Notas: "{cliente.notas}"
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Clientes;