// src/pages/Locales.tsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, Clock, TrendingUp, Users, Plus, Edit, Trash2, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import ClientIntake from "@/components/ClientIntake";
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';


// Definir la interfaz para Local (AHORA COINCIDE CON LA DB + CAMPOS MAPEADOS DEL BACKEND)
interface Local {
  id: number;
  // Campos del frontend mapeados desde la DB por el controlador de backend
  type: "peluqueria" | "spa" | "barberia"; 
  peluqueros: number; 
  ingresosMes: number; 
  clientesActivos: number; 

  // Campos directos que se esperan de la tabla 'locales' de la DB
  nombre: string;
  direccion: string;
  telefono: string;
  horario: string;
  imagen: string; 
  estado: "Activo" | "Inactivo"; 

  // Los campos 'username' y 'password' no pertenecen a la tabla 'locales' en la DB
  // y por lo tanto no se incluyen aquí como propiedades directas del Local fetched.
  // Se manejan para la creación de usuarios en la tabla 'users'.
}

const initialNewLocalState = {
  nombre: "",
  direccion: "",
  telefono: "",
  username: "", // Se sigue pidiendo para crear el usuario encargado
  password: ""  // Se sigue pidiendo para crear el usuario encargado
};

const Locales = () => {
  const { userRole, localId: authLocalId } = useAuth();
  const navigate = useNavigate();

  const [locales, setLocales] = useState<Local[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingLocal, setEditingLocal] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newLocalData, setNewLocalData] = useState(initialNewLocalState);
  const [isLoadingLocales, setIsLoadingLocales] = useState(true);
  const [errorLocales, setErrorLocales] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocales = async () => {
      setIsLoadingLocales(true);
      setErrorLocales(null);
      try {
        const response = await fetch('http://localhost:3001/api/locales');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: Local[] = await response.json();
        setLocales(data);
      } catch (err) {
        console.error("Error fetching locales:", err);
        setErrorLocales("Error al cargar los locales. Por favor, inténtalo de nuevo.");
        toast.error("Error de carga", {
          description: "No se pudieron obtener los datos de los locales del servidor."
        });
      } finally {
        setIsLoadingLocales(false);
      }
    };
    fetchLocales();
  }, []);

  const filteredLocales = useMemo(() => {
    let currentLocales = locales;
  
    if (userRole === 'encargado' && authLocalId) {
      currentLocales = currentLocales.filter(local => local.id === parseInt(authLocalId, 10));
    }
  
    return currentLocales.filter(local =>
      local.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      local.direccion.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [locales, searchTerm, userRole, authLocalId]);
  

  const handleEdit = (local: any) => {
    setEditingLocal(local);
    toast.success(`Editando ${local.nombre}`);
  };

  const handleDelete = async (idToDelete: number) => {
    try {
        const response = await fetch(`http://localhost:3001/api/locales/${idToDelete}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error al eliminar local: ${errorData.message || response.statusText}`);
        }

        setLocales(prevLocales => prevLocales.filter(local => local.id !== idToDelete));
        toast.success("Local eliminado correctamente.");
    } catch (err: any) {
        console.error("Error al eliminar local:", err);
        toast.error("Error al eliminar local", {
            description: err.message || "No se pudo eliminar el local del servidor."
        });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setNewLocalData(prevData => ({ ...prevData, [id]: value }));
  };

  const handleSaveLocal = async () => {
    const { nombre, direccion, telefono, username, password } = newLocalData;
    if (!nombre || !direccion || !telefono || !username || !password) {
      toast.error("Todos los campos son obligatorios.");
      return;
    }

    try {
        // Enviar todos los datos necesarios para la creación del local y el usuario encargado
        const newLocalToSend = {
            type: "peluqueria", // Este 'type' se mapea a 'tipo_local' en el backend
            nombre,
            direccion,
            telefono,
            horario: "Lun-Sab 9:00-20:00",
            peluqueros: 0,
            ingresosMes: 0,
            clientesActivos: 0,
            imagen: `https://source.unsplash.com/random/300x200?barbershop,${nombre}`, 
            estado: "Activo", 
            username, 
            password, 
        };

        const response = await fetch('http://localhost:3001/api/locales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newLocalToSend)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error al guardar local en el backend: ${errorData.message || response.statusText}`);
        }
        
        const savedLocal: Local = await response.json();

        setLocales(prevLocales => [...prevLocales, savedLocal]);
        toast.success(`El local "${savedLocal.nombre}" ha sido agregado exitosamente.`);
        setNewLocalData(initialNewLocalState);
        setIsDialogOpen(false);
    } catch (err: any) {
        console.error("Error al guardar local:", err);
        toast.error("Error al guardar local", {
            description: err.message || "No se pudo guardar el local en el servidor."
        });
    }
  };


  const handleNavigate = (idToNavigate: number) => {
    if (idToNavigate) {
      navigate(`/locales/${idToNavigate}`);
    } else {
      toast.error("Error de navegación", { description: "ID de local no válido." });
    }
  };

  if (isLoadingLocales) {
    return (
      <div className="p-6">
        <h2 className="text-3xl font-bold mb-6">Locales</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
                <Separator className="my-4" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-8 w-1/3" />
                  <Skeleton className="h-8 w-1/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (errorLocales) {
    return (
      <div className="p-6">
        <h2 className="text-3xl font-bold mb-6">Locales</h2>
        <div className="text-red-500">{errorLocales}</div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-background via-stylepro-lavender-50/30 to-stylepro-blue-50/20">
      <div className="container mx-auto px-6 py-8 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Gestión de Locales</h1>
          <p className="text-muted-foreground">Administra y monitorea todos tus locales desde un solo lugar</p>
          <ClientIntake />
        </div>

        {userRole === 'admin' && (
          <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Buscar locales..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" /> Filtros
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-stylepro-lavender-600 hover:bg-stylepro-lavender-700 flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Nuevo Local
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Agregar Nuevo Local</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="nombre" className="text-right">Nombre</Label>
                      <Input id="nombre" value={newLocalData.nombre} onChange={handleInputChange} placeholder="StylePro..." className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="direccion" className="text-right">Dirección</Label>
                      <Input id="direccion" value={newLocalData.direccion} onChange={handleInputChange} placeholder="Av. Principal 123..." className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="telefono" className="text-right">Teléfono</Label>
                      <Input id="telefono" value={newLocalData.telefono} onChange={handleInputChange} placeholder="+52 55..." className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="username" className="text-right">Usuario</Label>
                      <Input id="username" value={newLocalData.username} onChange={handleInputChange} placeholder="usuario_local" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="password" className="text-right">Contraseña</Label>
                      <Input id="password" type="password" value={newLocalData.password} onChange={handleInputChange} className="col-span-3" />
                    </div>
                  </div>
                  <Button onClick={handleSaveLocal} className="w-full">
                    Guardar Local
                  </Button>
                </DialogContent>
              </Dialog>

            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLocales.map((local, index) => (
            <div key={local.id} onClick={() => handleNavigate(local.id)} className="cursor-pointer">
              <Card className="group overflow-hidden hover:shadow-lg hover-scale transition-all duration-300 border-0 shadow-md animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="relative h-48">
                  <img src={local.imagen} alt={local.nombre} className="w-full h-full object-cover" />
                  {userRole === 'admin' && (
                    <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); handleEdit(local); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); handleDelete(local.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <CardHeader><CardTitle>{local.nombre}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /><span>{local.direccion}</span></div>
                    <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /><span>{local.telefono}</span></div>
                    <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" /><span>{local.horario}</span></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-stylepro-gold-600 mb-1"><TrendingUp className="h-4 w-4" /></div>
                      <p className="text-lg font-semibold">S/{local.ingresosMes.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Ingresos/Mes</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-stylepro-lavender-600 mb-1"><Users className="h-4 w-4" /></div>
                      <p className="text-lg font-semibold">{local.peluqueros}</p>
                      <p className="text-xs text-muted-foreground">Peluqueros</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-stylepro-blue-600 mb-1"><Users className="h-4 w-4" /></div>
                      <p className="text-lg font-semibold">{local.clientesActivos}</p>
                      <p className="text-xs text-muted-foreground">Clientes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {filteredLocales.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No se encontraron locales.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Locales;