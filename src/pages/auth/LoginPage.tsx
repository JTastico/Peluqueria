import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from "sonner";
import { localesData, adminCredentials } from '@/data/locales-data'; // Importamos los datos

export function LoginPage() {
  const [username, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    const inputUser = username.toLowerCase();

    // 1. Verificar si es el administrador
    if (inputUser === adminCredentials.username && password === adminCredentials.password) {
      localStorage.setItem('userRole', 'admin');
      localStorage.setItem('username', adminCredentials.username);
      toast.success(`Bienvenido, ${adminCredentials.username}!`);
      navigate('/'); // Redirige al admin al dashboard
      return;
    }

    // 2. Verificar si es un usuario de un local
    const foundLocal = localesData.find(local => local.username === inputUser && local.password === password);
    if (foundLocal) {
      localStorage.setItem('userRole', 'local'); // Rol genérico para locales
      localStorage.setItem('username', foundLocal.username);
      localStorage.setItem('localId', String(foundLocal.id)); // Guardamos el ID del local
      toast.success(`Bienvenido, ${foundLocal.nombre}!`);
      navigate('/'); // Redirige al usuario del local
      return;
    }

    // 3. Si no se encuentra ninguna credencial
    toast.error('Credenciales incorrectas', {
      description: 'Por favor, verifica tu usuario y contraseña.',
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-stylepro-lavender-50/30 to-stylepro-blue-50/20">
      <Card className="w-full max-w-sm shadow-2xl animate-fade-in">
        <CardHeader>
          <CardTitle className="text-2xl text-center font-bold text-foreground">
            Koko
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Ingrese su usuario"
                  value={username}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Ingrese su contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-stylepro-lavender-600 hover:bg-stylepro-lavender-700">
                Iniciar Sesión
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}