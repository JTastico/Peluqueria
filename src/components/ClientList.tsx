// Asumiendo que este es el componente que lista los clientes, por ejemplo, en ClientIntake.tsx
// o un nuevo componente como ClientList.tsx

import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth'; // Asegúrate de que la ruta sea correcta

interface Cliente {
    id: number;
    nombre: string;
    apellido: string;
    fecha_cita: string;
    hora_cita: string;
    servicio_nombre: string;
    trabajador_nombre: string;
    trabajador_apellido: string;
    local_nombre: string;
}

const ClientList: React.FC = () => {
    const { user } = useAuth(); // Obtener el usuario del contexto de autenticación
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchClientes = async () => {
            if (!user) {
                setLoading(false);
                setError("Usuario no autenticado.");
                return;
            }

            setLoading(true);
            setError(null);

            let url = 'http://localhost:3001/api/clientes';

            // Si el usuario no es admin, filtramos por su local_id
            if (user.role !== 'admin' && user.local_id) {
                url += `?localId=${user.local_id}`;
            }
            // Si es admin, no se añade localId, y el backend devolverá todos los clientes

            try {
                const response = await fetch(url, {
                    headers: {
                        'Content-Type': 'application/json',
                        // Si usas tokens de autenticación, añádelos aquí:
                        // 'Authorization': `Bearer ${user.token}` 
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Error al cargar clientes');
                }

                const data = await response.json();
                setClientes(data);
            } catch (err: any) {
                console.error("Error fetching clients:", err);
                setError(err.message || "Error desconocido al cargar clientes.");
            } finally {
                setLoading(false);
            }
        };

        fetchClientes();
    }, [user]); // Vuelve a ejecutar cuando el objeto de usuario cambie

    if (loading) {
        return <div>Cargando clientes...</div>;
    }

    if (error) {
        return <div style={{ color: 'red' }}>Error: {error}</div>;
    }

    return (
        <div>
            <h2>Listado de Clientes</h2>
            {clientes.length === 0 ? (
                <p>No hay clientes registrados.</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Apellido</th>
                            <th>Local</th>
                            <th>Servicio</th>
                            <th>Trabajador</th>
                            <th>Fecha Cita</th>
                            <th>Hora Cita</th>
                            <th>Estado</th>
                            {/* Agrega más encabezados según necesites */}
                        </tr>
                    </thead>
                    <tbody>
                        {clientes.map((cliente) => (
                            <tr key={cliente.id}>
                                <td>{cliente.id}</td>
                                <td>{cliente.nombre}</td>
                                <td>{cliente.apellido}</td>
                                <td>{cliente.local_nombre}</td>
                                <td>{cliente.servicio_nombre}</td>
                                <td>{cliente.trabajador_nombre} {cliente.trabajador_apellido}</td>
                                <td>{cliente.fecha_cita}</td>
                                <td>{cliente.hora_cita}</td>
                                <td>{cliente.estado}</td>
                                {/* Agrega más celdas de datos */}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ClientList;