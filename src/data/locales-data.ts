// Define la estructura de un local
export interface Local {
  id: number;
  type: "peluqueria" | "spa";
  nombre: string;
  direccion: string;
  telefono: string;
  horario: string;
  peluqueros: number;
  ingresosMes: number;
  clientesActivos: number;
  imagen: string;
  estado: "Activo" | "Inactivo";
  // Credenciales específicas para este local
  username: string;
  password: string;
}

// Datos de todos los locales
export const localesData: Local[] = [
  {
    id: 1,
    type: "peluqueria",
    nombre: "Barberia Koko",
    direccion: "Av. Principal 123, Centro",
    telefono: "+52 55 1234-5678",
    horario: "Lun-Sab 9:00-20:00",
    peluqueros: 5,
    ingresosMes: 85000,
    clientesActivos: 142,
    imagen: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&h=200&fit=crop",
    estado: "Activo",
    username: "barberia",
    password: "barberia"
  },
  {
    id: 2,
    type: "peluqueria",
    nombre: "Peluqueria Koko",
    direccion: "Blvd. Norte 456, Zona Norte",
    telefono: "+52 55 2345-6789",
    horario: "Lun-Dom 8:00-21:00",
    peluqueros: 7,
    ingresosMes: 92000,
    clientesActivos: 186,
    imagen: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=300&h=200&fit=crop",
    estado: "Activo",
    username: "peluqueria",
    password: "peluqueria"
  },
  {
    id: 3,
    type: "spa",
    nombre: "Spa Koko",
    direccion: "Col. Sur 789, Zona Sur",
    telefono: "+52 55 3456-7890",
    horario: "Lun-Sab 10:00-19:00",
    peluqueros: 4,
    ingresosMes: 67000,
    clientesActivos: 98,
    imagen: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=300&h=200&fit=crop",
    estado: "Activo",
    username: "spa",
    password: "spa"
  }
];

// Credenciales del administrador
export const adminCredentials = {
  username: "admin",
  password: "admin"
};