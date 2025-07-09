
import { useState } from "react";
import { Star, MapPin, Phone, Award, Scissors, Plus, Edit, Trash2, Search, Filter, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const peluquerosData = [
  {
    id: 1,
    nombre: "María González",
    especialidad: "Corte y Color",
    local: "StylePro Centro",
    telefono: "+52 55 1111-1111",
    experiencia: "8 años",
    rating: 4.9,
    clientesAtendidos: 1248,
    ingresosMes: 28000,
    foto: "https://images.unsplash.com/photo-1594824475325-7014831b4902?w=150&h=150&fit=crop&crop=face",
    servicios: ["Corte Clásico", "Coloración", "Mechas", "Tratamientos"]
  },
  {
    id: 2,
    nombre: "Carlos Mendoza",
    especialidad: "Barbería Clásica",
    local: "StylePro Norte",
    telefono: "+52 55 2222-2222",
    experiencia: "12 años",
    rating: 4.8,
    clientesAtendidos: 2156,
    ingresosMes: 32000,
    foto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    servicios: ["Corte Clásico", "Barba", "Bigote", "Afeitado"]
  },
  {
    id: 3,
    nombre: "Ana Rodríguez",
    especialidad: "Estilismo Avanzado",
    local: "StylePro Centro",
    telefono: "+52 55 3333-3333",
    experiencia: "6 años",
    rating: 4.7,
    clientesAtendidos: 896,
    ingresosMes: 24000,
    foto: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    servicios: ["Peinados", "Ondulado", "Alisado", "Eventos"]
  },
  {
    id: 4,
    nombre: "Roberto Silva",
    especialidad: "Corte Moderno",
    local: "StylePro Sur",
    telefono: "+52 55 4444-4444",
    experiencia: "4 años",
    rating: 4.6,
    clientesAtendidos: 672,
    ingresosMes: 21000,
    foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    servicios: ["Corte Fade", "Undercut", "Pompadour", "Texturizado"]
  },
  {
    id: 5,
    nombre: "Laura Jiménez",
    especialidad: "Color Especialista",
    local: "StylePro Norte",
    telefono: "+52 55 5555-5555",
    experiencia: "10 años",
    rating: 4.9,
    clientesAtendidos: 1432,
    ingresosMes: 30000,
    foto: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    servicios: ["Balayage", "Highlights", "Color Fantasy", "Corrección"]
  }
];

const Peluqueros = () => {
  const [peluqueros, setPeluqueros] = useState(peluquerosData);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLocal, setFilterLocal] = useState("todos");

  const filteredPeluqueros = peluqueros.filter(peluquero => {
    const matchesSearch = peluquero.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         peluquero.especialidad.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocal = filterLocal === "todos" || peluquero.local.includes(filterLocal);
    return matchesSearch && matchesLocal;
  });

  const handleEdit = (peluquero: any) => {
    toast.success(`Editando perfil de ${peluquero.nombre}`);
  };

  const handleSchedule = (peluquero: any) => {
    toast.success(`Abriendo horario de ${peluquero.nombre}`);
  };

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
            <Select value={filterLocal} onValueChange={setFilterLocal}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por local" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los locales</SelectItem>
                <SelectItem value="Centro">StylePro Centro</SelectItem>
                <SelectItem value="Norte">StylePro Norte</SelectItem>
                <SelectItem value="Sur">StylePro Sur</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-stylepro-lavender-600 hover:bg-stylepro-lavender-700 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Peluquero
              </Button>
            </DialogTrigger>
            <DialogContent className="pointer-events-auto">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Peluquero</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="nombre" className="text-right">Nombre</Label>
                  <Input id="nombre" placeholder="Nombre completo..." className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="especialidad" className="text-right">Especialidad</Label>
                  <Input id="especialidad" placeholder="Especialidad..." className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="local" className="text-right">Local</Label>
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Seleccionar local" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="centro">StylePro Centro</SelectItem>
                      <SelectItem value="norte">StylePro Norte</SelectItem>
                      <SelectItem value="sur">StylePro Sur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={() => toast.success("Peluquero agregado exitosamente")} className="w-full">
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
                    variant="outline" 
                    className="h-8 w-8 p-0"
                    onClick={() => handleSchedule(peluquero)}
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-4">
                  <img 
                    src={peluquero.foto} 
                    alt={peluquero.nombre}
                    className="w-16 h-16 rounded-full object-cover border-4 border-stylepro-lavender-200 transition-transform hover:scale-110"
                  />
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{peluquero.nombre}</CardTitle>
                    <p className="text-stylepro-lavender-600 font-medium text-sm">{peluquero.especialidad}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-4 w-4 fill-stylepro-gold-500 text-stylepro-gold-500" />
                      <span className="text-sm font-medium">{peluquero.rating}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{peluquero.local}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{peluquero.telefono}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Award className="h-4 w-4" />
                    <span>{peluquero.experiencia} de experiencia</span>
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
