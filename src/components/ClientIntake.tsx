// src/components/ClientIntake.tsx

import { useState, useMemo, useEffect } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// Define la interfaz Local para los datos que vienen del backend
interface Local {
  id: number;
  type: "peluqueria" | "spa" | "barberia";
  nombre: string;
  direccion: string;
  telefono: string;
  horario: string;
  peluqueros: number;
  ingresosMes: number;
  clientesActivos: number;
  imagen: string;
  estado: "Activo" | "Inactivo";
  username: string;
  password: string;
  servicios: string[];
  trabajadores: string[]; // Asegúrate que esta propiedad exista en la interfaz, incluso si no se usa directamente desde locales
}

export function ClientIntake() {
  const { userRole, localId } = useAuth();
  const [servicio, setServicio] = useState("");
  const [trabajador, setTrabajador] = useState("");
  const [tipoPago, setTipoPago] = useState("efectivo");
  const [reseña, setReseña] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [fetchedLocalesData, setFetchedLocalesData] = useState<Local[] | Local | null>(null);
  const [isLoadingLocales, setIsLoadingLocales] = useState(true);
  const [errorLocales, setErrorLocales] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocales = async () => {
      setIsLoadingLocales(true);
      setErrorLocales(null);
      try {
        let url = '';
        if (userRole === 'admin') {
          url = 'http://localhost:3001/api/locales';
        } else if (userRole === 'encargado' && localId) {
          url = `http://localhost:3001/api/locales/${localId}`;
        } else {
          setFetchedLocalesData(null);
          setIsLoadingLocales(false);
          return;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Error al cargar datos de locales: ${response.statusText}`);
        }
        const data = await response.json();
        setFetchedLocalesData(data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("Error al obtener datos de locales:", err);
        setErrorLocales("No se pudieron cargar los datos de locales. Inténtalo de nuevo.");
        toast.error("Error de carga", {
            description: "No se pudieron obtener los servicios y trabajadores del servidor."
        });
      } finally {
        setIsLoadingLocales(false);
      }
    };

    fetchLocales();
  }, [userRole, localId]);

  const { availableServices, availableWorkers } = useMemo(() => {
    if (isLoadingLocales || errorLocales || !fetchedLocalesData) {
        return { availableServices: [], availableWorkers: [] };
    }

    if (userRole === 'admin') {
      const allLocales = Array.isArray(fetchedLocalesData) ? fetchedLocalesData as Local[] : []; // Asegura que sea un array
      // CAMBIO CLAVE AQUÍ: Añadir || [] para asegurar que servicios sea un array
      const allServices = [...new Set(allLocales.flatMap(local => local.servicios || []))];
      // CAMBIO CLAVE AQUÍ: Añadir || [] para asegurar que trabajadores sea un array
      // NOTA: 'trabajadores' ya no está en la tabla 'locales'. Deberías obtenerlos de la tabla 'trabajadores'
      // o pasarlos como prop desde Locales/LocalDetail si se necesitan aquí.
      // Por ahora, asumiré que ClientIntake NO necesitará todos los trabajadores de todos los locales
      // si no se los pasa directamente desde Locales.tsx.
      // Si el userRole es admin y necesita TODOS los trabajadores, tendrías que hacer otra llamada a la API de trabajadores.
      // Si 'trabajadores' viene de la tabla 'locales' y es null, esto lo manejará.
      const allWorkers = [...new Set(allLocales.flatMap(local => local.trabajadores || []))]; // Si trabajadores se obtiene de los locales

      return { availableServices: allServices, availableWorkers: allWorkers };
    }
    
    // Si es un encargado de local
    if (userRole === 'encargado' && localId) {
      const currentLocal = fetchedLocalesData as Local;
      if (currentLocal && currentLocal.id === parseInt(localId, 10)) {
        // CAMBIO CLAVE AQUÍ: Añadir || [] para asegurar que servicios sea un array
        return {
          availableServices: currentLocal.servicios || [],
          availableWorkers: currentLocal.trabajadores || [] // Si trabajadores se obtiene del local específico
        };
      }
    }
    
    return { availableServices: [], availableWorkers: [] };
  }, [userRole, localId, fetchedLocalesData, isLoadingLocales, errorLocales]);

  const handleRegister = () => {
    if (!servicio) {
      toast.error("Por favor, selecciona un tipo de servicio.");
      return;
    }
    
    console.log({ servicio, trabajador: trabajador || "Asignado automáticamente", tipoPago, reseña });
    toast.success("Cliente registrado exitosamente.", { description: `Servicio de ${servicio} registrado.` });

    setServicio("");
    setTrabajador("");
    setTipoPago("efectivo");
    setReseña("");
    setIsDrawerOpen(false);
  };

  return (
    <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <DrawerTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Ingreso de Cliente
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-2xl">
          <DrawerHeader>
            <DrawerTitle>Pasarela de Ingreso de Cliente</DrawerTitle>
            <DrawerDescription>
              Completa la información para registrar el servicio del cliente.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="service-type">1. Tipo de Servicio</Label>
                    <Select value={servicio} onValueChange={setServicio}>
                      <SelectTrigger id="service-type">
                          <SelectValue placeholder="Seleccione un servicio..." />
                      </SelectTrigger>
                      <SelectContent>
                          {isLoadingLocales ? (
                            <SelectItem value="loading" disabled>Cargando servicios...</SelectItem>
                          ) : errorLocales ? (
                            <SelectItem value="error" disabled>Error al cargar</SelectItem>
                          ) : availableServices.length > 0 ? (
                            availableServices.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)
                          ) : (
                            <SelectItem value="none" disabled>No hay servicios disponibles</SelectItem>
                          )}
                      </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="worker">2. ¿Quién lo atenderá?</Label>
                    <Select value={trabajador} onValueChange={setTrabajador}>
                      <SelectTrigger id="worker">
                          <SelectValue placeholder="Seleccione un trabajador..." />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="any">Asignar trabajador libre</SelectItem>
                          {isLoadingLocales ? (
                            <SelectItem value="loading" disabled>Cargando trabajadores...</SelectItem>
                          ) : errorLocales ? (
                            <SelectItem value="error" disabled>Error al cargar</SelectItem>
                          ) : availableWorkers.length > 0 ? (
                            availableWorkers.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)
                          ) : (
                            <SelectItem value="none" disabled>No hay trabajadores disponibles</SelectItem>
                          )}
                      </SelectContent>
                    </Select>
                </div>
                
                <div className="grid gap-2">
                    <Label>3. Tipo de Pago</Label>
                    <RadioGroup value={tipoPago} onValueChange={setTipoPago} className="flex space-x-4">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="efectivo" id="r1" /><Label htmlFor="r1">Efectivo</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="tarjeta" id="r2" /><Label htmlFor="r2">Tarjeta</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="yape" id="r3" /><Label htmlFor="r3">Yape</Label></div>
                    </RadioGroup>
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="review">4. Reseña del Cliente (Opcional)</Label>
                <Textarea id="review" value={reseña} placeholder="El cliente puede dejar una reseña sobre el local y la atención..." className="h-48" onChange={(e) => setReseña(e.target.value)}/>
            </div>
          </div>
          <DrawerFooter className="pt-2 flex-row-reverse">
            <Button onClick={handleRegister}>Registrar Servicio</Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}