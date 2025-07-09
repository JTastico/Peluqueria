
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Settings, User, Bell, Database, Save, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Configuraciones = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Estados para diferentes configuraciones
  const [generalConfig, setGeneralConfig] = useState({
    businessName: "StylePro Salón",
    email: "admin@stylepro.com",
    phone: "+1 (555) 123-4567",
    address: "123 Beauty Street, City 12345"
  });

  const [notificationConfig, setNotificationConfig] = useState({
    emailNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    promotionAlerts: true
  });

  const [systemConfig, setSystemConfig] = useState({
    timezone: "America/New_York",
    language: "es",
    currency: "USD",
    dateFormat: "DD/MM/YYYY"
  });

  const handleSaveSettings = async () => {
    setLoading(true);
    // Simular guardado
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    
    toast({
      title: "Configuraciones guardadas",
      description: "Los cambios se han aplicado correctamente.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-stylepro-lavender-50/30 to-stylepro-blue-50/20 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-stylepro-lavender-600 to-stylepro-gold-600 bg-clip-text text-transparent">
              Configuraciones
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestiona las configuraciones del sistema y personaliza tu experiencia
            </p>
          </div>
          <Button onClick={handleSaveSettings} disabled={loading} className="bg-stylepro-lavender-600 hover:bg-stylepro-lavender-700">
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>

        {/* Tabs de Configuración */}
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="usuarios" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="notificaciones" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificaciones
            </TabsTrigger>
            <TabsTrigger value="sistema" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Sistema
            </TabsTrigger>
          </TabsList>

          {/* Tab General */}
          <TabsContent value="general" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-stylepro-lavender-200/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-stylepro-lavender-600" />
                  Información General del Negocio
                </CardTitle>
                <CardDescription>
                  Configura la información básica de tu salón de belleza
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Nombre del Negocio</Label>
                    <Input
                      id="businessName"
                      value={generalConfig.businessName}
                      onChange={(e) => setGeneralConfig({...generalConfig, businessName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Principal</Label>
                    <Input
                      id="email"
                      type="email"
                      value={generalConfig.email}
                      onChange={(e) => setGeneralConfig({...generalConfig, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={generalConfig.phone}
                      onChange={(e) => setGeneralConfig({...generalConfig, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                      id="address"
                      value={generalConfig.address}
                      onChange={(e) => setGeneralConfig({...generalConfig, address: e.target.value})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Usuarios */}
          <TabsContent value="usuarios" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-stylepro-lavender-200/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-stylepro-lavender-600" />
                  Gestión de Usuarios
                </CardTitle>
                <CardDescription>
                  Administra los permisos y roles de usuario
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-stylepro-lavender-500 to-stylepro-gold-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">AD</span>
                    </div>
                    <div>
                      <p className="font-medium">Administrador Principal</p>
                      <p className="text-sm text-muted-foreground">admin@stylepro.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-stylepro-lavender-100 text-stylepro-lavender-700">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                    <Button variant="outline" size="sm">
                      Editar
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Crear Nuevo Usuario</h3>
                    <p className="text-sm text-muted-foreground">Agregar un nuevo usuario al sistema</p>
                  </div>
                  <Button className="bg-stylepro-lavender-600 hover:bg-stylepro-lavender-700">
                    Agregar Usuario
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Notificaciones */}
          <TabsContent value="notificaciones" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-stylepro-lavender-200/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-stylepro-lavender-600" />
                  Preferencias de Notificaciones
                </CardTitle>
                <CardDescription>
                  Configura cómo y cuándo recibir notificaciones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones por Email</Label>
                    <p className="text-sm text-muted-foreground">Recibir notificaciones importantes por correo</p>
                  </div>
                  <Switch
                    checked={notificationConfig.emailNotifications}
                    onCheckedChange={(checked) => setNotificationConfig({...notificationConfig, emailNotifications: checked})}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones SMS</Label>
                    <p className="text-sm text-muted-foreground">Recibir alertas importantes por mensaje de texto</p>
                  </div>
                  <Switch
                    checked={notificationConfig.smsNotifications}
                    onCheckedChange={(checked) => setNotificationConfig({...notificationConfig, smsNotifications: checked})}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Recordatorios de Citas</Label>
                    <p className="text-sm text-muted-foreground">Enviar recordatorios automáticos a los clientes</p>
                  </div>
                  <Switch
                    checked={notificationConfig.appointmentReminders}
                    onCheckedChange={(checked) => setNotificationConfig({...notificationConfig, appointmentReminders: checked})}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alertas de Promociones</Label>
                    <p className="text-sm text-muted-foreground">Notificar sobre nuevas promociones y ofertas</p>
                  </div>
                  <Switch
                    checked={notificationConfig.promotionAlerts}
                    onCheckedChange={(checked) => setNotificationConfig({...notificationConfig, promotionAlerts: checked})}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Sistema */}
          <TabsContent value="sistema" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-stylepro-lavender-200/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-stylepro-lavender-600" />
                  Configuraciones del Sistema
                </CardTitle>
                <CardDescription>
                  Ajusta las configuraciones técnicas y regionales
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Zona Horaria</Label>
                    <Select value={systemConfig.timezone} onValueChange={(value) => setSystemConfig({...systemConfig, timezone: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Idioma</Label>
                    <Select value={systemConfig.language} onValueChange={(value) => setSystemConfig({...systemConfig, language: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Moneda</Label>
                    <Select value={systemConfig.currency} onValueChange={(value) => setSystemConfig({...systemConfig, currency: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Formato de Fecha</Label>
                    <Select value={systemConfig.dateFormat} onValueChange={(value) => setSystemConfig({...systemConfig, dateFormat: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="p-4 bg-stylepro-lavender-50 rounded-lg border border-stylepro-lavender-200">
                  <h3 className="font-medium text-stylepro-lavender-800 mb-2">Información del Sistema</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Versión:</span>
                      <span className="ml-2 font-medium">v2.1.0</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Última actualización:</span>
                      <span className="ml-2 font-medium">15/12/2024</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Configuraciones;
