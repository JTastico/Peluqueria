// backend/db.js
const mysql = require('mysql2/promise');
require('dotenv').config(); // Cargar variables de entorno

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let pool; // Pool de conexiones a la base de datos

// Datos iniciales de locales
const initialLocalesData = [
  { id: 1, type: "barberia", nombre: "Barberia Koko", direccion: "Av. Principal 123, Centro", telefono: "+52 55 1234-5678", horario: "Lun-Sab 9:00-20:00", peluqueros: 5, ingresosMes: 85000, clientesActivos: 142, imagen: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&h=200&fit=crop", estado: "Activo", username: "barberia", password: "barberia", servicios: ["Corte Clásico", "Afeitado con Toalla Caliente", "Diseño de Barba", "Tratamiento Capilar"] },
  { id: 2, type: "peluqueria", nombre: "Peluqueria Koko", direccion: "Blvd. Norte 456, Zona Norte", telefono: "+52 55 2345-6789", horario: "Lun-Dom 8:00-21:00", peluqueros: 7, ingresosMes: 92000, clientesActivos: 186, imagen: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=300&h=200&fit=crop", estado: "Activo", username: "peluqueria", password: "peluqueria", servicios: ["Corte de Dama", "Tinte y Mechas", "Peinado para Eventos", "Manicura y Pedicura"] },
  { id: 3, type: "spa", nombre: "Spa Koko", direccion: "Col. Sur 789, Zona Sur", telefono: "+52 55 3456-7890", horario: "Lun-Sab 10:00-19:00", peluqueros: 4, ingresosMes: 67000, clientesActivos: 98, imagen: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=300&h=200&fit=fit", estado: "Activo", username: "spa", password: "spa", servicios: ["Masaje Relajante", "Limpieza Facial Profunda", "Exfoliación Corporal", "Aromaterapia"] }
];

// Datos iniciales para la tabla 'trabajadores' (con nuevos campos)
const initialTrabajadoresData = [
    { id: 1, nombre: "María", apellido: "González", edad: 30, dni: "12345678A", telefono: "+52 55 1111-1111", nacionalidad: "Mexicana", estado_civil: "Soltera", fecha_ingreso: "2017-03-15", nivel_estudios: "Grado Superior", experiencia: 8, cantidad_hijos: 0, especialidad: "Corte y Color", rating: 4.9, clientesAtendidos: 1248, ingresosMes: 28000, foto: "https://images.unsplash.com/photo-1594824475325-7014831b4902?w=150&h=150&fit=crop&crop=face", servicios: ["Corte Clásico", "Coloración", "Mechas", "Tratamientos"], local_id: 1 },
    { id: 2, nombre: "Carlos", apellido: "Mendoza", edad: 45, dni: "87654321B", telefono: "+52 55 2222-2222", nacionalidad: "Colombiana", estado_civil: "Casado", fecha_ingreso: "2010-06-01", nivel_estudios: "Licenciatura", experiencia: 12, cantidad_hijos: 2, especialidad: "Barbería Clásica", rating: 4.8, clientesAtendidos: 2156, ingresosMes: 32000, foto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face", servicios: ["Corte Clásico", "Barba", "Bigote", "Afeitado"], local_id: 2 },
    { id: 3, nombre: "Ana", apellido: "Rodríguez", edad: 28, dni: "13579246C", telefono: "+52 55 3333-3333", nacionalidad: "Mexicana", estado_civil: "Soltera", fecha_ingreso: "2019-01-10", nivel_estudios: "Técnico", experiencia: 6, cantidad_hijos: 0, especialidad: "Estilismo Avanzado", rating: 4.7, clientesAtendidos: 896, ingresosMes: 24000, foto: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face", servicios: ["Peinados", "Ondulado", "Alisado", "Eventos"], local_id: 1 },
    { id: 4, nombre: "Roberto", apellido: "Silva", edad: 35, dni: "24680135D", telefono: "+52 55 4444-4444", nacionalidad: "Peruana", estado_civil: "Casado", fecha_ingreso: "2021-09-01", nivel_estudios: "Bachillerato", experiencia: 4, cantidad_hijos: 1, especialidad: "Corte Moderno", rating: 4.6, clientesAtendidos: 672, ingresosMes: 21000, foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face", servicios: ["Corte Fade", "Undercut", "Pompadour", "Texturizado"], local_id: 3 },
    { id: 5, nombre: "Laura", apellido: "Jiménez", edad: 40, dni: "98765432E", telefono: "+52 55 5555-5555", nacionalidad: "Española", estado_civil: "Divorciada", fecha_ingreso: "2015-02-20", nivel_estudios: "Doctorado", experiencia: 10, cantidad_hijos: 3, especialidad: "Color Especialista", rating: 4.9, clientesAtendidos: 1432, ingresosMes: 30000, foto: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face", servicios: ["Balayage", "Highlights", "Color Fantasy", "Corrección"], local_id: 2 }
];


const initializeDatabase = async () => {
    try {
        pool = mysql.createPool(dbConfig);
        console.log('Pool de conexiones MySQL creado.');

        const connection = await pool.getConnection();
        console.log('Conectado a la base de datos MySQL.');
        connection.release();

        // Crear la tabla de usuarios si no existe
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL,
                local_id BIGINT
            )
        `);
        console.log('Tabla de users creada o ya existe.');

        const [userRows] = await pool.query("SELECT COUNT(*) as count FROM users");
        if (userRows[0].count === 0) {
            await pool.query("INSERT INTO users (username, password, role, local_id) VALUES (?, ?, ?, ?)", ["admin", "admin", "admin", null]);
            await pool.query("INSERT INTO users (username, password, role, local_id) VALUES (?, ?, ?, ?)", ["barberia", "barberia", "encargado", 1]);
            await pool.query("INSERT INTO users (username, password, role, local_id) VALUES (?, ?, ?, ?)", ["peluqueria", "peluqueria", "encargado", 2]);
            await pool.query("INSERT INTO users (username, password, role, local_id) VALUES (?, ?, ?, ?)", ["spa", "spa", "encargado", 3]);
            console.log('Usuarios por defecto insertados.');
        }

        // Tabla de locales (sin cambios en su esquema)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS locales (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                type VARCHAR(50) NOT NULL,
                nombre VARCHAR(255) NOT NULL,
                direccion VARCHAR(255),
                telefono VARCHAR(50),
                horario VARCHAR(100),
                peluqueros INT,
                ingresosMes DECIMAL(10, 2),
                clientesActivos INT,
                imagen VARCHAR(255),
                estado VARCHAR(50),
                username VARCHAR(255),
                password VARCHAR(255),
                servicios JSON
            )
        `);
        console.log('Tabla de locales creada o ya existe.');

        // Tabla de trabajadores (creación con el esquema actualizado)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS trabajadores (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                apellido VARCHAR(255) NOT NULL,
                edad INT,
                dni VARCHAR(20) UNIQUE,
                telefono VARCHAR(50),
                nacionalidad VARCHAR(100),
                estado_civil VARCHAR(50),
                fecha_ingreso DATE,
                nivel_estudios VARCHAR(255),
                experiencia INT,
                cantidad_hijos INT,
                especialidad VARCHAR(255),
                rating DECIMAL(3, 2),
                clientesAtendidos INT,
                ingresosMes DECIMAL(10, 2),
                foto VARCHAR(255),
                servicios JSON,
                local_id BIGINT NOT NULL,
                FOREIGN KEY (local_id) REFERENCES locales(id) ON DELETE CASCADE
            )
        `);
        console.log('Tabla de trabajadores creada o ya existe.');

        // LÓGICA DE INSERCIÓN INICIAL PARA LOCALES (sin cambios)
        for (const local of initialLocalesData) {
            const [existing] = await pool.query('SELECT id FROM locales WHERE id = ?', [local.id]);
            if (existing.length === 0) {
                await pool.query(
                    `INSERT INTO locales (id, type, nombre, direccion, telefono, horario, peluqueros, ingresosMes, clientesActivos, imagen, estado, username, password, servicios)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [local.id, local.type, local.nombre, local.direccion, local.telefono, local.horario, local.peluqueros, local.ingresosMes, local.clientesActivos, local.imagen, local.estado, local.username, local.password, JSON.stringify(local.servicios)]
                );
            }
        }
        console.log('Datos de locales por defecto insertados en MySQL (o ya existían).');


        // Insertar datos de trabajadores si la tabla está vacía (con nuevos campos)
        const [trabajadoresRowsCount] = await pool.query("SELECT COUNT(*) as count FROM trabajadores");
        if (trabajadoresRowsCount[0].count === 0) {
            for (const trabajador of initialTrabajadoresData) {
                const [localExists] = await pool.query('SELECT id FROM locales WHERE id = ?', [trabajador.local_id]);
                if (localExists.length > 0) {
                    await pool.query(
                        `INSERT INTO trabajadores (id, nombre, apellido, edad, dni, telefono, nacionalidad, estado_civil, fecha_ingreso, nivel_estudios, experiencia, cantidad_hijos, especialidad, rating, clientesAtendidos, ingresosMes, foto, servicios, local_id)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [trabajador.id, trabajador.nombre, trabajador.apellido, trabajador.edad, trabajador.dni, trabajador.telefono, trabajador.nacionalidad, trabajador.estado_civil, trabajador.fecha_ingreso, trabajador.nivel_estudios, trabajador.experiencia, trabajador.cantidad_hijos, trabajador.especialidad, trabajador.rating, trabajador.clientesAtendidos, trabajador.ingresosMes, trabajador.foto, JSON.stringify(trabajador.servicios), trabajador.local_id]
                    );
                } else {
                    console.warn(`Advertencia: Local con ID ${trabajador.local_id} no encontrado para el trabajador ${trabajador.nombre}. No se insertará este trabajador.`);
                }
            }
            console.log('Datos de trabajadores por defecto insertados (o ya existían).');
        }

    } catch (err) {
        console.error('Error al inicializar la base de datos:', err.message);
        process.exit(1);
    }
};

const getDb = () => {
    if (!pool) {
        throw new Error('La base de datos no ha sido inicializada. Llama a initializeDatabase() primero.');
    }
    return pool;
};

module.exports = { initializeDatabase, getDb };