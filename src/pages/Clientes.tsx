
import { useState } from "react";
import { Search, Filter, Phone, Mail, MapPin, Plus, Edit, Eye, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const clientesData = [
  {
    id: 1,
    nombre: "Patricia López",
    telefono: "+52 55 1234-5678",
    email: "patricia.lopez@email.com",
    ultimaVisita: "2024-01-15",
    totalVisitas: 24,
    gastoTotal: 12800,
    localPreferido: "StylePro Centro",
    peluqueroPreferido: "María González",
    estado: "Activo"
  },
  {
    id: 2,
    nombre: "Juan Pérez",
    telefono: "+52 55 2345-6789",
    email: "juan.perez@email.com",
    ultimaVisita: "2024-01-12",
    totalVisitas: 18,
    gastoTotal: 8900,
    localPreferido: "StylePro Norte",
    peluqueroPreferido: "Carlos Mendoza",
    estado: "Activo"
  },
  {
    id: 3,
    nombre: "Carmen Ruiz",
    telefono: "+52 55 3456-7890",
    email: "carmen.ruiz@email.com",
    ultimaVisita: "2024-01-10",
    totalVisitas: 31,
    gastoTotal: 18500,
    localPreferido: "StylePro Centro",
    peluqueroPreferido: "Ana Rodríguez",
    estado: "VIP"
  },
  {
    id: 4,
    nombre: "Miguel Torres",
    telefono: "+52 55 4567-8901",
    email: "miguel.torres@email.com",
    ultimaVisita: "2023-12-28",
    totalVisitas: 8,
    gastoTotal: 3200,
    localPreferido: "StylePro Sur",
    peluqueroPreferido: "Roberto Silva",
    estado: "Inactivo"
  },
  {
    id: 5,
    nombre: "Andrea Morales",
    telefono: "+52 55 5678-9012",
    email: "andrea.morales@email.com",
    ultimaVisita: "2024-01-14",
    totalVisitas: 42,
    gastoTotal: 25600,
    localPreferido: "StylePro Norte",
    peluqueroPreferido: "Laura Jiménez",
    estado: "VIP"
  },
  {
    id: 6,
    nombre: "Daniel Vargas",
    telefono: "+52 55 6789-0123",
    email: "daniel.vargas@email.com",
    ultimaVisita: "2024-01-11",
    totalVisitas: 15,
    gastoTotal: 7800,
    localPreferido: "StylePro Centro",
    peluqueroPreferido: "María González",
    estado: "Activo"
  }
];

const Clientes = () => {
  const [clientes, setClientes] = useState(clientesData);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");

  const filteredClientes = clientes.filter(cliente => {
    const matchesSearch = cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.telefono.includes(searchTerm) ||
                         cliente.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = filterEstado === "todos" || cliente.estado === filterEstado;
    return matchesSearch && matchesEstado;
  });

  const handleViewProfile = (cliente: any) => {
    toast.success(`Abriendo perfil de ${cliente.nombre}`);
  };

  const handleEdit = (cliente: any) => {
    toast.success(`Editando cliente ${cliente.nombre}`);
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'VIP':
        return <Badge className="bg-stylepro-gold-500 hover:bg-stylepro-gold-600">VIP</Badge>;
      case 'Activo':
        return <Badge className="bg-green-500 hover:bg-green-600">Activo</Badge>;
      case 'Inactivo':
        return <Badge variant="secondary">Inactivo</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-stylepro-lavender-50/30 to-stylepro-blue-50/20">
      <div className="container mx-auto px-6 py-8 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Gestión de Clientes</h1>
          <p className="text-muted-foreground">Administra tu base de clientes y su historial</p>
        </div>

        {/* Filtros y búsqueda */}
        <Card className="mb-6 border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Filtros de Búsqueda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input 
                    placeholder="Buscar cliente por nombre, teléfono o email..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="Activo">Activos</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                  <SelectItem value="Inactivo">Inactivos</SelectItem>
                </SelectContent>
              </Select>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-stylepro-lavender-600 hover:bg-stylepro-lavender-700 flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Nuevo Cliente
                  </Button>
                </DialogTrigger>
                <DialogContent className="pointer-events-auto">
                  <DialogHeader>
                    <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="nombre" className="text-right">Nombre</Label>
                      <Input id="nombre" placeholder="Nombre completo..." className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="telefono" className="text-right">Teléfono</Label>
                      <Input id="telefono" placeholder="+52 55..." className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">Email</Label>
                      <Input id="email" type="email" placeholder="email@ejemplo.com" className="col-span-3" />
                    </div>
                  </div>
                  <Button onClick={() => toast.success("Cliente agregado exitosamente")} className="w-full">
                    Guardar Cliente
                  </Button>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de clientes */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Lista de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Última Visita</TableHead>
                  <TableHead className="text-center">Visitas</TableHead>
                  <TableHead className="text-center">Gasto Total</TableHead>
                  <TableHead>Preferencias</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClientes.map((cliente) => (
                  <TableRow key={cliente.id} className="hover:bg-stylepro-lavender-50/50 group animate-fade-in">
                    <TableCell>
                      <div>
                        <p className="font-medium">{cliente.nombre}</p>
                        <p className="text-sm text-muted-foreground">ID: {cliente.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3" />
                          <span>{cliente.telefono}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3" />
                          <span className="text-muted-foreground">{cliente.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{cliente.ultimaVisita}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium">{cliente.totalVisitas}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium text-stylepro-gold-600">
                        S/{cliente.gastoTotal.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-3 w-3" />
                          <span>{cliente.localPreferido}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{cliente.peluqueroPreferido}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center gap-2 justify-center">
                        {getEstadoBadge(cliente.estado)}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleViewProfile(cliente)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleEdit(cliente)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Clientes;
