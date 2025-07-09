
import { useState } from "react";
import { Scissors, Clock, DollarSign, TrendingUp, Plus, Edit, Settings, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const serviciosData = [
  {
    id: 1,
    nombre: "Corte Clásico",
    categoria: "Corte",
    precio: 250,
    duracion: "30 min",
    popularidad: 95,
    ingresosMes: 45000,
    clientesMes: 180,
    descripcion: "Corte tradicional adaptado al estilo de cada cliente"
  },
  {
    id: 2,
    nombre: "Coloración Completa",
    categoria: "Color",
    precio: 800,
    duracion: "2 hr",
    popularidad: 78,
    ingresosMes: 38400,
    clientesMes: 48,
    descripcion: "Cambio completo de color con productos premium"
  },
  {
    id: 3,
    nombre: "Mechas/Highlights",
    categoria: "Color",
    precio: 650,
    duracion: "1.5 hr",
    popularidad: 85,
    ingresosMes: 42250,
    clientesMes: 65,
    descripcion: "Mechas tradicionales o babylights para iluminar"
  },
  {
    id: 4,
    nombre: "Barba y Bigote",
    categoria: "Barbería",
    precio: 180,
    duracion: "20 min",
    popularidad: 72,
    ingresosMes: 12960,
    clientesMes: 72,
    descripcion: "Arreglo y diseño de barba y bigote"
  },
  {
    id: 5,
    nombre: "Peinado para Evento",
    categoria: "Peinado",
    precio: 450,
    duracion: "45 min",
    popularidad: 62,
    ingresosMes: 18900,
    clientesMes: 42,
    descripcion: "Peinado especializado para eventos especiales"
  },
  {
    id: 6,
    nombre: "Tratamiento Capilar",
    categoria: "Tratamiento",
    precio: 350,
    duracion: "40 min",
    popularidad: 58,
    ingresosMes: 14000,
    clientesMes: 40,
    descripcion: "Tratamiento nutritivo y reparador para el cabello"
  },
  {
    id: 7,
    nombre: "Alisado Permanente",
    categoria: "Tratamiento",
    precio: 1200,
    duracion: "3 hr",
    popularidad: 45,
    ingresosMes: 21600,
    clientesMes: 18,
    descripcion: "Alisado permanente con queratina"
  },
  {
    id: 8,
    nombre: "Ondulado/Rizado",
    categoria: "Peinado",
    precio: 380,
    duracion: "35 min",
    popularidad: 55,
    ingresosMes: 11400,
    clientesMes: 30,
    descripcion: "Ondas y rizos temporales con herramientas profesionales"
  }
];

const Servicios = () => {
  const [servicios, setServicios] = useState(serviciosData);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("todos");

  const filteredServicios = servicios.filter(servicio => {
    const matchesSearch = servicio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         servicio.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = filterCategoria === "todos" || servicio.categoria === filterCategoria;
    return matchesSearch && matchesCategoria;
  });

  const handleEdit = (servicio: any) => {
    toast.success(`Editando servicio: ${servicio.nombre}`);
  };

  const handlePriceUpdate = (servicio: any) => {
    toast.success(`Actualizando precio de ${servicio.nombre}`);
  };

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case "Corte":
        return "bg-stylepro-blue-100 text-stylepro-blue-800";
      case "Color":
        return "bg-stylepro-lavender-100 text-stylepro-lavender-800";
      case "Barbería":
        return "bg-stylepro-gold-100 text-stylepro-gold-800";
      case "Peinado":
        return "bg-green-100 text-green-800";
      case "Tratamiento":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPopularidadColor = (popularidad: number) => {
    if (popularidad >= 80) return "text-green-600";
    if (popularidad >= 60) return "text-stylepro-gold-600";
    return "text-red-600";
  };

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
              </SelectContent>
            </Select>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-stylepro-lavender-600 hover:bg-stylepro-lavender-700 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Servicio
              </Button>
            </DialogTrigger>
            <DialogContent className="pointer-events-auto">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Servicio</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="nombre" className="text-right">Nombre</Label>
                  <Input id="nombre" placeholder="Nombre del servicio..." className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="precio" className="text-right">Precio</Label>
                  <Input id="precio" type="number" placeholder="0" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="duracion" className="text-right">Duración</Label>
                  <Input id="duracion" placeholder="30 min" className="col-span-3" />
                </div>
              </div>
              <Button onClick={() => toast.success("Servicio agregado exitosamente")} className="w-full">
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
                    variant="outline" 
                    className="h-8 w-8 p-0"
                    onClick={() => handlePriceUpdate(servicio)}
                  >
                    <DollarSign className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <Badge className={getCategoriaColor(servicio.categoria)}>
                    {servicio.categoria}
                  </Badge>
                  <div className={`text-sm font-medium ${getPopularidadColor(servicio.popularidad)}`}>
                    {servicio.popularidad}% popular
                  </div>
                </div>
                <CardTitle className="text-lg">{servicio.nombre}</CardTitle>
                <p className="text-sm text-muted-foreground">{servicio.descripcion}</p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-stylepro-gold-600 hover-scale cursor-pointer" onClick={() => handlePriceUpdate(servicio)}>S/{servicio.precio}</span>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{servicio.duracion}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-stylepro-lavender-600 mb-1">
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-semibold">S/{servicio.ingresosMes.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Ingresos/Mes</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-stylepro-blue-600 mb-1">
                      <Scissors className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-semibold">{servicio.clientesMes}</p>
                    <p className="text-xs text-muted-foreground">Clientes/Mes</p>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-stylepro-lavender-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${servicio.popularidad}%` }}
                  ></div>
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
