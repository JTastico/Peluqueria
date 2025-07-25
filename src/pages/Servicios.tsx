// src/pages/Servicios.tsx
import { useState, useEffect, useMemo } from "react";
import { Scissors, Clock, DollarSign, Plus, Edit, Trash2, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { DialogDescription } from '@/components/ui/dialog';


// Definir la interfaz para un Servicio
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

// Definir la interfaz para Local
interface Local {
    id: number;
    nombre: string;
}

// CAMBIO CLAVE AQUÍ: Definir initialNewServicioState como una función
// para que pueda acceder a userRole y authLocalId
const getInitialNewServicioState = (userRole: string | null, authLocalId: string | null) => ({
    nombre: "",
    categoria: "",
    precio: "" as any,
    duracion: "",
    descripcion: "",
    local_id: userRole === 'encargado' && authLocalId ? authLocalId.toString() : "" // Inicializa con authLocalId si es encargado
});


const Servicios = () => {
  const { userRole, localId: authLocalId } = useAuth();
  
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [locales, setLocales] = useState<Local[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("todos");
  const [filterLocalId, setFilterLocalId] = useState("todos");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // CAMBIO CLAVE AQUÍ: Inicializar el estado usando la función
  const [newServicioData, setNewServicioData] = useState(() => getInitialNewServicioState(userRole, authLocalId));

  const [isLoadingServicios, setIsLoadingServicios] = useState(true);
  const [errorServicios, setErrorServicios] = useState<string | null>(null);
  const [isLoadingLocales, setIsLoadingLocales] = useState(true);


  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingServicios(true);
      setErrorServicios(null);
      try {
        let serviciosUrl = 'http://localhost:3001/api/servicios';
        if (userRole === 'encargado' && authLocalId) {
            serviciosUrl += `?local_id=${authLocalId}`;
        }

        const resServicios = await fetch(serviciosUrl);
        if (!resServicios.ok) throw new Error(`Error al cargar servicios: ${resServicios.statusText}`);
        const dataServicios: Servicio[] = await resServicios.json();

        const resLocales = await fetch('http://localhost:3001/api/locales');
        if (!resLocales.ok) throw new Error(`Error al cargar locales: ${resLocales.statusText}`);
        const dataLocales: Local[] = await resLocales.json();
        setLocales(dataLocales.map(l => ({ id: l.id, nombre: l.nombre })));

        const mappedServicios = dataServicios.map(s => ({
          ...s,
          local_nombre: dataLocales.find(l => l.id === s.local_id)?.nombre || 'Desconocido'
        }));
        setServicios(mappedServicios);

      } catch (err: any) {
        console.error("Error fetching data:", err);
        setErrorServicios(err.message || "Error al cargar los datos. Por favor, inténtalo de nuevo.");
        toast.error("Error de carga", {
            description: "No se pudieron obtener los datos de servicios o locales del servidor."
        });
      } finally {
        setIsLoadingServicios(false);
        setIsLoadingLocales(false);
      }
    };
    fetchData();
  }, [userRole, authLocalId]);


  const filteredServicios = useMemo(() => {
    return servicios.filter(servicio => {
      const matchesSearch = servicio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           servicio.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategoria = filterCategoria === "todos" || servicio.categoria === filterCategoria;
      const matchesLocalFilter = (userRole === 'admin' && filterLocalId === "todos") || 
                                 (userRole === 'admin' && servicio.local_id.toString() === filterLocalId) ||
                                 (userRole === 'encargado' && servicio.local_id.toString() === authLocalId);

      return matchesSearch && matchesCategoria && matchesLocalFilter;
    });
  }, [servicios, searchTerm, filterCategoria, filterLocalId, userRole, authLocalId]);


  const handleEdit = (servicio: Servicio) => {
    toast.success(`Editando servicio: ${servicio.nombre}`);
  };

  const handleDelete = async (idToDelete: number) => {
    try {
      const response = await fetch(`http://localhost:3001/api/servicios/${idToDelete}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error al eliminar servicio: ${errorData.message || response.statusText}`);
      }
      setServicios(prevServicios => prevServicios.filter(s => s.id !== idToDelete));
      toast.success("Servicio eliminado correctamente.");
    } catch (err: any) {
      console.error("Error al eliminar servicio:", err);
      toast.error("Error al eliminar servicio", {
        description: err.message || "No se pudo eliminar el servicio del servidor."
      });
    }
  };

  const handlePriceUpdate = (servicio: Servicio) => {
    toast.success(`Actualizando precio de ${servicio.nombre}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setNewServicioData(prevData => ({ ...prevData, [id]: value }));
  };

  const handleSaveServicio = async () => {
    const { nombre, categoria, precio, duracion, descripcion, local_id } = newServicioData;

    // VALIDACIÓN AJUSTADA: Si el usuario es encargado, usa su authLocalId para el local_id
    let finalLocalId = local_id;
    if (userRole === 'encargado' && authLocalId) {
        finalLocalId = authLocalId;
    }

    if (!nombre || !categoria || !precio || !finalLocalId) { // Usa finalLocalId para la validación
      toast.error("Nombre, categoría, precio y local son obligatorios.");
      return;
    }

    try {
      const servicioToSend = {
        nombre,
        categoria,
        precio: parseFloat(precio as any) || 0,
        duracion: duracion || null,
        descripcion: descripcion || null,
        local_id: parseInt(finalLocalId, 10) // Usa finalLocalId al enviar
      };

      const response = await fetch('http://localhost:3001/api/servicios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(servicioToSend)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error al guardar servicio en el backend: ${errorData.message || response.statusText}`);
      }

      const savedServicio: Servicio = await response.json();
      savedServicio.local_nombre = locales.find(l => l.id === savedServicio.local_id)?.nombre || 'Desconocido';
      
      setServicios(prevServicios => [...prevServicios, savedServicio]);
      toast.success(`El servicio "${savedServicio.nombre}" ha sido agregado exitosamente.`);
      setNewServicioData(getInitialNewServicioState(userRole, authLocalId)); // Resetear con el local_id correcto
      setIsDialogOpen(false);

    } catch (err: any) {
      console.error("Error al guardar servicio:", err);
      toast.error("Error al guardar servicio", {
        description: err.message || "No se pudo guardar el servicio en el servidor."
      });
    }
  };

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case "Corte": return "bg-stylepro-blue-100 text-stylepro-blue-800";
      case "Color": return "bg-stylepro-lavender-100 text-stylepro-lavender-800";
      case "Barbería": return "bg-stylepro-gold-100 text-stylepro-gold-800";
      case "Peinado": return "bg-green-100 text-green-800";
      case "Tratamiento": return "bg-purple-100 text-purple-800";
      case "Masaje": return "bg-pink-100 text-pink-800";
      case "Facial": return "bg-blue-100 text-blue-800";
      case "Uñas": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };


  if (isLoadingServicios || isLoadingLocales) {
    return (
      <div className="p-6">
        <h2 className="text-3xl font-bold mb-6">Servicios</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
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

  if (errorServicios) {
    return <div className="p-6 text-red-500">{errorServicios}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-stylepro-lavender-50/30 to-stylepro-blue-50/20">
      <div className="container mx-auto px-6 py-8 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Gestión de Servicios</h1>
          <p className="text-muted-foreground">Administra el catálogo de servicios y sus precios</p>
        </div>

        {/* Barra de herramientas */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Buscar servicios..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterCategoria} onValueChange={setFilterCategoria}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las categorías</SelectItem>
                <SelectItem value="Corte">Corte</SelectItem>
                <SelectItem value="Color">Color</SelectItem>
                <SelectItem value="Barbería">Barbería</SelectItem>
                <SelectItem value="Peinado">Peinado</SelectItem>
                <SelectItem value="Tratamiento">Tratamiento</SelectItem>
                <SelectItem value="Masaje">Masaje</SelectItem>
                <SelectItem value="Facial">Facial</SelectItem>
                <SelectItem value="Uñas">Uñas</SelectItem>
              </SelectContent>
            </Select>
            {/* Selector de Local */}
            {(userRole === 'admin' || !authLocalId) && ( // Solo visible para admin o si no hay localId
                <Select value={filterLocalId} onValueChange={setFilterLocalId}>
                <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por local" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="todos">Todos los locales</SelectItem>
                    {locales.map(local => (
                        <SelectItem key={local.id} value={local.id.toString()}>{local.nombre}</SelectItem>
                    ))}
                </SelectContent>
                </Select>
            )}
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-stylepro-lavender-600 hover:bg-stylepro-lavender-700 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Servicio
              </Button>
            </DialogTrigger>
            <DialogContent className="pointer-events-auto overflow-y-auto max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Servicio</DialogTitle>
                <DialogDescription>
                  Completa los detalles para añadir un nuevo servicio al catálogo.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="nombre" className="text-right">Nombre</Label>
                  <Input id="nombre" value={newServicioData.nombre} onChange={handleInputChange} placeholder="Nombre del servicio..." className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="categoria" className="text-right">Categoría</Label>
                  <Select value={newServicioData.categoria} onValueChange={(value) => setNewServicioData(prevData => ({ ...prevData, categoria: value }))}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Corte">Corte</SelectItem>
                      <SelectItem value="Color">Color</SelectItem>
                      <SelectItem value="Barbería">Barbería</SelectItem>
                      <SelectItem value="Peinado">Peinado</SelectItem>
                      <SelectItem value="Tratamiento">Tratamiento</SelectItem>
                      <SelectItem value="Masaje">Masaje</SelectItem>
                      <SelectItem value="Facial">Facial</SelectItem>
                      <SelectItem value="Uñas">Uñas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="precio" className="text-right">Precio</Label>
                  <Input id="precio" type="number" value={newServicioData.precio} onChange={handleInputChange} placeholder="0" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="duracion" className="text-right">Duración</Label>
                  <Input id="duracion" value={newServicioData.duracion} onChange={handleInputChange} placeholder="30 min" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="descripcion" className="text-right">Descripción</Label>
                  <Input id="descripcion" value={newServicioData.descripcion} onChange={handleInputChange} placeholder="Breve descripción del servicio..." className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="local_id" className="text-right">Local Asignado</Label>
                  {userRole === 'admin' ? (
                      <Select value={newServicioData.local_id} onValueChange={(value) => setNewServicioData(prevData => ({ ...prevData, local_id: value }))}>
                          <SelectTrigger className="col-span-3">
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
                          id="local_id_display"
                          value={locales.find(l => l.id.toString() === authLocalId)?.nombre || 'Cargando...'}
                          disabled
                          className="col-span-3"
                      />
                  )}
                </div>
              </div>
              <Button onClick={handleSaveServicio} className="w-full">
                Guardar Servicio
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredServicios.map((servicio, index) => (
            <Card key={servicio.id} className="group overflow-hidden hover:shadow-lg hover-scale transition-all duration-300 border-0 shadow-md animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <CardHeader className="pb-3 relative">
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="h-8 w-8 p-0"
                    onClick={() => handleEdit(servicio)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    className="h-8 w-8 p-0"
                    onClick={(e) => { e.stopPropagation(); handleDelete(servicio.id); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <Badge className={getCategoriaColor(servicio.categoria)}>
                    {servicio.categoria}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{servicio.nombre}</CardTitle>
                <p className="text-sm text-muted-foreground">{servicio.descripcion}</p>
                <p className="text-xs text-muted-foreground mt-1">Local: {servicio.local_nombre}</p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-stylepro-gold-600 hover-scale cursor-pointer" onClick={() => handlePriceUpdate(servicio)}>S/{servicio.precio.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{servicio.duracion}</span>
                  </div>
                </div>
                
                <div className="pt-2">
                  <p className="text-sm font-medium mb-2">Detalles Adicionales:</p>
                  <div className="flex flex-wrap gap-1">
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Servicios;