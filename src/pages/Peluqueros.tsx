// src/pages/Peluqueros.tsx
import { useState, useEffect, useMemo } from "react";
import { Star, MapPin, Phone, Award, Scissors, Plus, Edit, Trash2, Search, Filter } from "lucide-react";
import { CalendarIcon } from 'lucide-react'; // Importar CalendarIcon para el DatePicker
import { format } from "date-fns"; // Para formatear la fecha
import { es } from 'date-fns/locale'; // Para fechas en español
import { cn } from "@/lib/utils"; // Para utilidades de clases

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'; // Importar Popover
import { Calendar } from '@/components/ui/calendar'; // Importar Calendar


// Definir la interfaz para un trabajador (peluquero) con todos los nuevos campos
interface Trabajador {
  id: number;
  nombre: string;
  apellido: string; // Nuevo
  edad: number;    // Nuevo
  dni: string;     // Nuevo
  telefono: string;
  nacionalidad: string; // Nuevo
  estado_civil: string; // Nuevo
  fecha_ingreso: string; // Nuevo (YYYY-MM-DD)
  nivel_estudios: string; // Nuevo (renombrado de 'nivel_estudios_alcanzado')
  experiencia: number; // Ahora es número (años)
  cantidad_hijos: number; // Nuevo
  especialidad: string;
  rating: number;
  clientesAtendidos: number;
  ingresosMes: number;
  foto: string;
  servicios: string[];
  local_id: number;
  local_nombre?: string;
}

// Definir la interfaz para Local (para el selector de locales)
interface Local {
    id: number;
    nombre: string;
}

const initialNewPeluqueroState = {
  nombre: "",
  apellido: "",
  edad: "" as any, // Se convertirá a número
  dni: "",
  telefono: "",
  nacionalidad: "",
  estado_civil: "",
  fecha_ingreso: undefined as Date | undefined, // Para el DatePicker
  nivel_estudios: "",
  experiencia: "" as any, // Se convertirá a número
  cantidad_hijos: "" as any, // Se convertirá a número
  especialidad: "",
  rating: "" as any,
  clientesAtendidos: "" as any,
  ingresosMes: "" as any,
  foto: "",
  servicios: "", // Se manejará como string de CSV para el input
  local_id: "" // String para el selector, luego se parsea a number
};


const Peluqueros = () => {
  const [peluqueros, setPeluqueros] = useState<Trabajador[]>([]);
  const [locales, setLocales] = useState<Local[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLocalId, setFilterLocalId] = useState("todos");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPeluqueroData, setNewPeluqueroData] = useState(initialNewPeluqueroState);
  
  const [isLoadingPeluqueros, setIsLoadingPeluqueros] = useState(true);
  const [errorPeluqueros, setErrorPeluqueros] = useState<string | null>(null);

  const [isLoadingLocales, setIsLoadingLocales] = useState(true);
  const [errorLocales, setErrorLocales] = useState<string | null>(null);


  // --- useEffect para cargar los peluqueros y locales desde el backend ---
  useEffect(() => {
    const fetchData = async () => {
      // Cargar Peluqueros
      setIsLoadingPeluqueros(true);
      setErrorPeluqueros(null);
      try {
        const resPeluqueros = await fetch('http://localhost:3001/api/trabajadores');
        if (!resPeluqueros.ok) throw new Error(`Error al cargar peluqueros: ${resPeluqueros.statusText}`);
        const dataPeluqueros: Trabajador[] = await resPeluqueros.json();

        // Cargar Locales (para el mapeo de nombres y el filtro)
        setIsLoadingLocales(true);
        setErrorLocales(null);
        const resLocales = await fetch('http://localhost:3001/api/locales');
        if (!resLocales.ok) throw new Error(`Error al cargar locales: ${resLocales.statusText}`);
        const dataLocales: Local[] = await resLocales.json();
        setLocales(dataLocales.map(l => ({ id: l.id, nombre: l.nombre })));

        // Mapear el nombre del local a cada peluquero
        const mappedPeluqueros = dataPeluqueros.map(p => ({
          ...p,
          local_nombre: dataLocales.find(l => l.id === p.local_id)?.nombre || 'Desconocido'
        }));
        setPeluqueros(mappedPeluqueros);

      } catch (err: any) {
        console.error("Error fetching data:", err);
        setErrorPeluqueros(err.message || "Error al cargar los datos. Por favor, inténtalo de nuevo.");
        toast.error("Error de carga", {
            description: "No se pudieron obtener los datos de peluqueros o locales del servidor."
        });
      } finally {
        setIsLoadingPeluqueros(false);
        setIsLoadingLocales(false);
      }
    };
    fetchData();
  }, []);


  const filteredPeluqueros = useMemo(() => {
    return peluqueros.filter(peluquero => {
      const matchesSearch = 
        peluquero.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        peluquero.apellido.toLowerCase().includes(searchTerm.toLowerCase()) || // Nuevo campo
        peluquero.especialidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
        peluquero.dni.toLowerCase().includes(searchTerm.toLowerCase()) || // Nuevo campo
        peluquero.telefono.toLowerCase().includes(searchTerm.toLowerCase()); // Asumo que se busca por número/teléfono

      const matchesLocal = filterLocalId === "todos" || peluquero.local_id.toString() === filterLocalId;
      return matchesSearch && matchesLocal;
    });
  }, [peluqueros, searchTerm, filterLocalId]);


  const handleEdit = (peluquero: Trabajador) => {
    toast.success(`Editando perfil de ${peluquero.nombre}`);
    // Aquí puedes cargar los datos del peluquero en un formulario de edición
  };

  const handleDelete = async (idToDelete: number) => {
    try {
      const response = await fetch(`http://localhost:3001/api/trabajadores/${idToDelete}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`Error al eliminar peluquero: ${response.statusText}`);
      }
      setPeluqueros(prevPeluqueros => prevPeluqueros.filter(p => p.id !== idToDelete));
      toast.success("Peluquero eliminado correctamente.");
    } catch (err: any) {
      console.error("Error al eliminar peluquero:", err);
      toast.error("Error al eliminar peluquero", {
        description: err.message || "No se pudo eliminar el peluquero del servidor."
      });
    }
  };

  const handleSchedule = (peluquero: Trabajador) => {
    toast.success(`Abriendo horario de ${peluquero.nombre}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setNewPeluqueroData(prevData => ({ ...prevData, [id]: value }));
  };

  // Función para manejar el cambio de fecha del DatePicker
  const handleDateChange = (date: Date | undefined) => {
    setNewPeluqueroData(prevData => ({ ...prevData, fecha_ingreso: date }));
  };

  const handleSavePeluquero = async () => {
    const {
      nombre, apellido, edad, dni, telefono, nacionalidad, estado_civil,
      fecha_ingreso, nivel_estudios, experiencia, cantidad_hijos,
      especialidad, rating, clientesAtendidos, ingresosMes, foto, servicios, local_id
    } = newPeluqueroData;

    // Validaciones básicas para los nuevos campos
    if (!nombre || !apellido || !dni || !especialidad || !local_id || !fecha_ingreso) {
      toast.error("Nombre, apellido, DNI, especialidad, fecha de ingreso y local son obligatorios.");
      return;
    }

    try {
      const peluqueroToSend = {
        nombre,
        apellido,
        edad: parseInt(edad as any) || null, // Convertir a número
        dni,
        telefono: telefono || null,
        nacionalidad: nacionalidad || null,
        estado_civil: estado_civil || null,
        fecha_ingreso: fecha_ingreso ? format(fecha_ingreso, "yyyy-MM-dd") : null, // Formatear la fecha
        nivel_estudios: nivel_estudios || null,
        experiencia: parseInt(experiencia as any) || 0, // Convertir a número
        cantidad_hijos: parseInt(cantidad_hijos as any) || 0, // Convertir a número
        especialidad,
        rating: parseFloat(rating as any) || 0,
        clientesAtendidos: parseInt(clientesAtendidos as any) || 0,
        ingresosMes: parseFloat(ingresosMes as any) || 0,
        foto: foto || "https://via.placeholder.com/150",
        servicios: servicios ? servicios.split(',').map(s => s.trim()) : [],
        local_id: parseInt(local_id, 10)
      };

      const response = await fetch('http://localhost:3001/api/trabajadores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(peluqueroToSend)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error al guardar peluquero en el backend: ${errorData.message || response.statusText}`);
      }

      const savedPeluquero: Trabajador = await response.json();
      savedPeluquero.local_nombre = locales.find(l => l.id === savedPeluquero.local_id)?.nombre || 'Desconocido';
      
      setPeluqueros(prevPeluqueros => [...prevPeluqueros, savedPeluquero]);
      toast.success(`El peluquero "${savedPeluquero.nombre} ${savedPeluquero.apellido}" ha sido agregado exitosamente.`);
      setNewPeluqueroData(initialNewPeluqueroState);
      setIsDialogOpen(false);

    } catch (err: any) {
      console.error("Error al guardar peluquero:", err);
      toast.error("Error al guardar peluquero", {
        description: err.message || "No se pudo guardar el peluquero en el servidor."
      });
    }
  };


  if (isLoadingPeluqueros || isLoadingLocales) {
    return (
      <div className="p-6">
        <h2 className="text-3xl font-bold mb-6">Peluqueros</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="flex-1 ml-4 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
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

  if (errorPeluqueros || errorLocales) {
    return <div className="p-6 text-red-500">{errorPeluqueros || errorLocales}</div>;
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-stylepro-lavender-50/30 to-stylepro-blue-50/20">
      <div className="container mx-auto px-6 py-8 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Gestión de Peluqueros</h1>
          <p className="text-muted-foreground">Administra tu equipo de profesionales</p>
        </div>

        {/* Barra de herramientas */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Buscar peluqueros..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
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
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-stylepro-lavender-600 hover:bg-stylepro-lavender-700 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Peluquero
              </Button>
            </DialogTrigger>
            <DialogContent className="pointer-events-auto overflow-y-auto max-h-[90vh]"> {/* Ajuste para scroll */}
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Peluquero</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4 grid-cols-1 md:grid-cols-2"> {/* Formulario de dos columnas */}
                {/* Primera Columna (Información Básica) */}
                <div className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="nombre">Nombre</Label>
                        <Input id="nombre" value={newPeluqueroData.nombre} onChange={handleInputChange} placeholder="Nombre..." />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="apellido">Apellido</Label>
                        <Input id="apellido" value={newPeluqueroData.apellido} onChange={handleInputChange} placeholder="Apellido..." />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="especialidad">Especialidad</Label>
                        <Input id="especialidad" value={newPeluqueroData.especialidad} onChange={handleInputChange} placeholder="Especialidad..." />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="dni">DNI</Label>
                        <Input id="dni" value={newPeluqueroData.dni} onChange={handleInputChange} placeholder="12345678A" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="telefono">Teléfono</Label>
                        <Input id="telefono" value={newPeluqueroData.telefono} onChange={handleInputChange} placeholder="+52 55..." />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="local_id">Local Asignado</Label>
                        <Select value={newPeluqueroData.local_id} onValueChange={(value) => setNewPeluqueroData(prevData => ({ ...prevData, local_id: value }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar local" />
                            </SelectTrigger>
                            <SelectContent>
                                {locales.map(local => (
                                    <SelectItem key={local.id} value={local.id.toString()}>{local.nombre}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="foto">URL Foto</Label>
                        <Input id="foto" value={newPeluqueroData.foto} onChange={handleInputChange} placeholder="https://ejemplo.com/foto.jpg" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="servicios">Servicios (CSV)</Label>
                        <Input id="servicios" value={newPeluqueroData.servicios} onChange={handleInputChange} placeholder="Corte, Color, Peinado" />
                    </div>
                </div>

                {/* Segunda Columna (Detalles Personales/Profesionales) */}
                <div className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="edad">Edad</Label>
                        <Input id="edad" type="number" value={newPeluqueroData.edad} onChange={handleInputChange} placeholder="30" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="nacionalidad">Nacionalidad</Label>
                        <Input id="nacionalidad" value={newPeluqueroData.nacionalidad} onChange={handleInputChange} placeholder="Mexicana" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="estado_civil">Estado Civil</Label>
                        <Input id="estado_civil" value={newPeluqueroData.estado_civil} onChange={handleInputChange} placeholder="Soltero/a" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="fecha_ingreso">Fecha de Ingreso</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !newPeluqueroData.fecha_ingreso && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {newPeluqueroData.fecha_ingreso ? format(newPeluqueroData.fecha_ingreso, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={newPeluqueroData.fecha_ingreso}
                                    onSelect={handleDateChange}
                                    initialFocus
                                    locale={es} // Establecer el locale español
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="nivel_estudios">Nivel de Estudios</Label>
                        <Input id="nivel_estudios" value={newPeluqueroData.nivel_estudios} onChange={handleInputChange} placeholder="Grado Superior..." />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="experiencia">Años de Experiencia</Label>
                        <Input id="experiencia" type="number" value={newPeluqueroData.experiencia} onChange={handleInputChange} placeholder="5" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="cantidad_hijos">Cantidad de Hijos</Label>
                        <Input id="cantidad_hijos" type="number" value={newPeluqueroData.cantidad_hijos} onChange={handleInputChange} placeholder="0" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="rating">Rating (1.0-5.0)</Label>
                        <Input id="rating" type="number" step="0.1" value={newPeluqueroData.rating} onChange={handleInputChange} placeholder="4.5" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="clientesAtendidos">Clientes Atendidos</Label>
                        <Input id="clientesAtendidos" type="number" value={newPeluqueroData.clientesAtendidos} onChange={handleInputChange} placeholder="1000" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="ingresosMes">Ingresos/Mes</Label>
                        <Input id="ingresosMes" type="number" step="0.01" value={newPeluqueroData.ingresosMes} onChange={handleInputChange} placeholder="25000" />
                    </div>
                </div>
              </div>
              <Button onClick={handleSavePeluquero} className="w-full">
                Guardar Peluquero
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPeluqueros.map((peluquero, index) => (
            <Card key={peluquero.id} className="group overflow-hidden hover:shadow-lg hover-scale transition-all duration-300 border-0 shadow-md animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <CardHeader className="pb-4 relative">
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="h-8 w-8 p-0"
                    onClick={() => handleEdit(peluquero)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    className="h-8 w-8 p-0"
                    onClick={(e) => { e.stopPropagation(); handleDelete(peluquero.id); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-4">
                  <img 
                    src={peluquero.foto || "https://via.placeholder.com/150"}
                    alt={peluquero.nombre}
                    className="w-16 h-16 rounded-full object-cover border-4 border-stylepro-lavender-200 transition-transform hover:scale-110"
                  />
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{peluquero.nombre} {peluquero.apellido}</CardTitle> {/* Apellido */}
                    <p className="text-stylepro-lavender-600 font-medium text-sm">{peluquero.especialidad}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-4 w-4 fill-stylepro-gold-500 text-stylepro-gold-500" />
                      <span className="text-sm font-medium">{peluquero.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{peluquero.local_nombre}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{peluquero.telefono}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Award className="h-4 w-4" />
                    <span>{peluquero.experiencia} años de experiencia</span> {/* Experiencia como número */}
                  </div>
                  {/* Nuevos campos para mostrar */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>Edad: {peluquero.edad}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>DNI: {peluquero.dni}</span>
                  </div>
                   <div className="flex items-center gap-2 text-muted-foreground">
                    <span>Nacionalidad: {peluquero.nacionalidad}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>Estado Civil: {peluquero.estado_civil}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>Ingreso: {peluquero.fecha_ingreso ? format(new Date(peluquero.fecha_ingreso), "PPP", { locale: es }) : 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>Estudios: {peluquero.nivel_estudios}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>Hijos: {peluquero.cantidad_hijos}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-stylepro-gold-600">S/{peluquero.ingresosMes.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Ingresos/Mes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-stylepro-blue-600">{peluquero.clientesAtendidos}</p>
                    <p className="text-xs text-muted-foreground">Clientes</p>
                  </div>
                </div>
                
                <div className="pt-2">
                  <p className="text-sm font-medium mb-2">Servicios:</p>
                  <div className="flex flex-wrap gap-1">
                    {peluquero.servicios.map((servicio, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {servicio}
                      </Badge>
                    ))}
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

export default Peluqueros;