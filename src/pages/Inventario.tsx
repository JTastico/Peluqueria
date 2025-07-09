
import { Package, AlertTriangle, TrendingDown, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const inventarioData = {
  "StylePro Centro": [
    { producto: "Shampoo Profesional", stock: 45, minimo: 10, precio: 180, consumoMes: 28, estado: "Disponible" },
    { producto: "Acondicionador Premium", stock: 32, minimo: 8, precio: 200, consumoMes: 22, estado: "Disponible" },
    { producto: "Tinte Rubio Ceniza", stock: 3, minimo: 5, precio: 350, consumoMes: 12, estado: "Bajo" },
    { producto: "Cera Modeladora", stock: 18, minimo: 6, precio: 120, consumoMes: 15, estado: "Disponible" },
    { producto: "Spray Fijador", stock: 2, minimo: 4, precio: 95, consumoMes: 8, estado: "Crítico" }
  ],
  "StylePro Norte": [
    { producto: "Shampoo Profesional", stock: 38, minimo: 10, precio: 180, consumoMes: 35, estado: "Disponible" },
    { producto: "Tinte Castaño", stock: 15, minimo: 8, precio: 350, consumoMes: 18, estado: "Disponible" },
    { producto: "Mascarilla Reparadora", stock: 4, minimo: 6, precio: 280, consumoMes: 14, estado: "Bajo" },
    { producto: "Gel Transparente", stock: 22, minimo: 5, precio: 85, consumoMes: 12, estado: "Disponible" },
    { producto: "Aceite Capilar", stock: 1, minimo: 3, precio: 220, consumoMes: 7, estado: "Crítico" }
  ],
  "StylePro Sur": [
    { producto: "Shampoo Profesional", stock: 28, minimo: 10, precio: 180, consumoMes: 20, estado: "Disponible" },
    { producto: "Decolorante", stock: 6, minimo: 4, precio: 450, consumoMes: 8, estado: "Disponible" },
    { producto: "Tinte Negro", stock: 2, minimo: 5, precio: 350, consumoMes: 9, estado: "Bajo" },
    { producto: "Mousse Volumen", stock: 12, minimo: 3, precio: 140, consumoMes: 6, estado: "Disponible" },
    { producto: "Serum Brillo", stock: 0, minimo: 2, precio: 320, consumoMes: 4, estado: "Agotado" }
  ]
};

const Inventario = () => {
  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'Disponible':
        return <Badge className="bg-green-500 hover:bg-green-600">Disponible</Badge>;
      case 'Bajo':
        return <Badge className="bg-stylepro-gold-500 hover:bg-stylepro-gold-600">Bajo Stock</Badge>;
      case 'Crítico':
        return <Badge className="bg-red-500 hover:bg-red-600">Crítico</Badge>;
      case 'Agotado':
        return <Badge variant="destructive">Agotado</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const getStockPercentage = (stock: number, minimo: number) => {
    const maxStock = Math.max(stock, minimo * 3);
    return Math.min((stock / maxStock) * 100, 100);
  };

  const getStockColor = (estado: string) => {
    switch (estado) {
      case 'Disponible':
        return 'bg-green-500';
      case 'Bajo':
        return 'bg-stylepro-gold-500';
      case 'Crítico':
        return 'bg-red-500';
      case 'Agotado':
        return 'bg-gray-500';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-stylepro-lavender-50/30 to-stylepro-blue-50/20">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Gestión de Inventario</h1>
          <p className="text-muted-foreground">Controla el stock y consumo de productos por local</p>
        </div>

        <Tabs defaultValue="StylePro Centro" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="StylePro Centro">StylePro Centro</TabsTrigger>
            <TabsTrigger value="StylePro Norte">StylePro Norte</TabsTrigger>
            <TabsTrigger value="StylePro Sur">StylePro Sur</TabsTrigger>
          </TabsList>

          {Object.entries(inventarioData).map(([local, productos]) => (
            <TabsContent key={local} value={local}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="border-0 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-stylepro-blue-100 rounded-lg">
                        <Package className="h-5 w-5 text-stylepro-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Productos</p>
                        <p className="text-2xl font-bold">{productos.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-stylepro-gold-100 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-stylepro-gold-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Stock Bajo</p>
                        <p className="text-2xl font-bold text-stylepro-gold-600">
                          {productos.filter(p => p.estado === 'Bajo' || p.estado === 'Crítico').length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Agotados</p>
                        <p className="text-2xl font-bold text-red-600">
                          {productos.filter(p => p.estado === 'Agotado').length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-stylepro-lavender-100 rounded-lg">
                        <BarChart3 className="h-5 w-5 text-stylepro-lavender-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Valor Total</p>
                        <p className="text-2xl font-bold text-stylepro-lavender-600">
                          S/{productos.reduce((sum, p) => sum + (p.stock * p.precio), 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">Inventario - {local}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-center">Stock Actual</TableHead>
                        <TableHead className="text-center">Stock Mínimo</TableHead>
                        <TableHead className="text-center">Precio Unit.</TableHead>
                        <TableHead className="text-center">Consumo/Mes</TableHead>
                        <TableHead className="text-center">Nivel Stock</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productos.map((producto, index) => (
                        <TableRow key={index} className="hover:bg-stylepro-lavender-50/50">
                          <TableCell className="font-medium">{producto.producto}</TableCell>
                          <TableCell className="text-center">
                            <span className="font-semibold">{producto.stock}</span>
                          </TableCell>
                          <TableCell className="text-center">{producto.minimo}</TableCell>
                          <TableCell className="text-center">S/{producto.precio}</TableCell>
                          <TableCell className="text-center">{producto.consumoMes}</TableCell>
                          <TableCell className="text-center">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${getStockColor(producto.estado)}`}
                                style={{ width: `${getStockPercentage(producto.stock, producto.minimo)}%` }}
                              ></div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {getEstadoBadge(producto.estado)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default Inventario;
