// src/pages/auth/LoginPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from "sonner";
import { useAuth } from '@/hooks/useAuth'; // Importamos useAuth

export function LoginPage() {
  const [username, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth(); // Obtenemos la función login del hook

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevenir el comportamiento por defecto del formulario

    try {
      const response = await fetch('http://localhost:3001/api/login', { // Asegúrate que el puerto 3001 sea el de tu backend
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Si la respuesta es exitosa, llama a la función `login` de tu hook `useAuth`
        // Asegúrate de que `login` pueda manejar `role` y `local_id`
        login(data.user.username, data.user.role, data.user.local_id);
        toast.success(`Bienvenido, ${data.user.username}!`);
        navigate('/'); // Redirige al dashboard o la ruta principal
      } else {
        // Si hay un error en la respuesta del servidor
        toast.error('Credenciales incorrectas', {
          description: data.message || 'Por favor, verifica tu usuario y contraseña.',
        });
      }
    } catch (error) {
      console.error('Error al intentar iniciar sesión:', error);
      toast.error('Error de conexión', {
        description: 'No se pudo conectar con el servidor. Por favor, inténtalo de nuevo.',
      });
    }
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
          <form onSubmit={handleLogin}>
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