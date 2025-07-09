import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const useAuth = () => {
  const navigate = useNavigate();
  
  // Obtenemos todos los datos de sesión del localStorage
  const userRole = localStorage.getItem('userRole');
  const username = localStorage.getItem('username');
  const localId = localStorage.getItem('localId');

  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    localStorage.removeItem('localId');
    toast.info("Has cerrado la sesión.");
    navigate('/login');
  };

  // Devolvemos todos los datos de sesión para usarlos en la app
  return { userRole, username, localId, logout };
};