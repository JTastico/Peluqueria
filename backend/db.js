// backend/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let pool;

const initialLocalesData = [
  { id: 1, type: "barberia", nombre: "Barberia Koko", direccion: "Av. Principal 123, Centro", telefono: "+52 55 1234-5678", horario: "Lun-Sab 9:00-20:00", peluqueros: 5, ingresosMes: 85000, clientesActivos: 142, imagen: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&h=200&fit=crop", estado: "Activo", username: "barberia", password: "barberia" },
  { id: 2, type: "peluqueria", nombre: "Peluqueria Koko", direccion: "Blvd. Norte 456, Zona Norte", telefono: "+52 55 2345-6789", horario: "Lun-Dom 8:00-21:00", peluqueros: 7, ingresosMes: 92000, clientesActivos: 186, imagen: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=300&h=200&fit=crop", estado: "Activo", username: "peluqueria", password: "peluqueria" },
  { id: 3, type: "spa", nombre: "Spa Koko", direccion: "Col. Sur 789, Zona Sur", telefono: "+52 55 3456-7890", horario: "Lun-Sab 10:00-19:00", peluqueros: 4, ingresosMes: 67000, clientesActivos: 98, imagen: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=300&h=200&fit=fit", estado: "Activo", username: "spa", password: "spa" }
];

const initialTrabajadoresData = [
    { id: 1, nombre: "María", apellido: "González", edad: 30, dni: "12345678A", telefono: "+52 55 1111-1111", nacionalidad: "Mexicana", estado_civil: "Soltera", fecha_ingreso: "2017-03-15", nivel_estudios: "Grado Superior", experiencia: 8, cantidad_hijos: 0, especialidad: "Corte y Color", rating: 4.9, clientesAtendidos: 1248, ingresosMes: 28000, foto: "https://images.unsplash.com/photo-1594824475325-7014831b4902?w=150&h=150&fit=crop&crop=face", servicios: ["Corte Clásico", "Coloración", "Mechas", "Tratamientos"], local_id: 1 },
    { id: 2, nombre: "Carlos", apellido: "Mendoza", edad: 45, dni: "87654321B", telefono: "+52 55 2222-2222", nacionalidad: "Colombiana", estado_civil: "Casado", fecha_ingreso: "2010-06-01", nivel_estudios: "Licenciatura", experiencia: 12, cantidad_hijos: 2, especialidad: "Barbería Clásica", rating: 4.8, clientesAtendidos: 2156, ingresosMes: 32000, foto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face", servicios: ["Corte Clásico", "Barba", "Bigote", "Afeitado"], local_id: 2 },
    { id: 3, nombre: "Ana", apellido: "Rodríguez", edad: 28, dni: "13579246C", telefono: "+52 55 3333-3333", nacionalidad: "Mexicana", estado_civil: "Soltera", fecha_ingreso: "2019-01-10", nivel_estudios: "Técnico", experiencia: 6, cantidad_hijos: 0, especialidad: "Estilismo Avanzado", rating: 4.7, clientesAtendidos: 896, ingresosMes: 24000, foto: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face", servicios: ["Peinados", "Ondulado", "Alisado", "Eventos"], local_id: 1 },
    { id: 4, nombre: "Roberto", apellido: "Silva", edad: 35, dni: "24680135D", telefono: "+52 55 4444-4444", nacionalidad: "Peruana", estado_civil: "Casado", fecha_ingreso: "2021-09-01", nivel_estudios: "Bachillerato", experiencia: 4, cantidad_hijos: 1, especialidad: "Corte Moderno", rating: 4.6, clientesAtendidos: 672, ingresosMes: 21000, foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face", servicios: ["Corte Fade", "Undercut", "Pompadour", "Texturizado"], local_id: 3 },
    { id: 5, nombre: "Laura", apellido: "Jiménez", edad: 40, dni: "98765432E", telefono: "+52 55 5555-5555", nacionalidad: "Española", estado_civil: "Divorciada", fecha_ingreso: "2015-02-20", nivel_estudios: "Doctorado", experiencia: 10, cantidad_hijos: 3, especialidad: "Color Especialista", rating: 4.9, clientesAtendidos: 1432, ingresosMes: 30000, foto: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face", servicios: ["Balayage", "Highlights", "Color Fantasy", "Corrección"], local_id: 2 }
];

const initialServiciosData = [
  { id: 101, nombre: "Corte Masculino Clásico", categoria: "Corte", precio: 25.00, duracion: "30 min", descripcion: "Corte de cabello tradicional para hombres.", local_id: 1 },
  { id: 102, nombre: "Afeitado con Toalla Caliente", categoria: "Barbería", precio: 20.00, duracion: "25 min", descripcion: "Afeitado tradicional con toalla caliente y productos post-afeitado.", local_id: 1 },
  { id: 103, nombre: "Diseño de Barba y Bigote", categoria: "Barbería", precio: 18.00, duracion: "20 min", descripcion: "Perfilado y diseño profesional de barba y bigote.", local_id: 1 },
  { id: 201, nombre: "Corte Femenino Moderno", categoria: "Corte", precio: 35.00, duracion: "45 min", descripcion: "Corte de cabello moderno y personalizado para mujeres.", local_id: 2 },
  { id: 202, nombre: "Coloración Balayage", categoria: "Color", precio: 120.00, duracion: "3 hr", descripcion: "Técnica de coloración Balayage para un look natural.", local_id: 2 },
  { id: 203, nombre: "Peinado para Fiesta", categoria: "Peinado", precio: 50.00, duracion: "60 min", descripcion: "Peinado elegante y duradero para ocasiones especiales.", local_id: 2 },
  { id: 301, nombre: "Masaje Relajante Completo", categoria: "Masaje", precio: 60.00, duracion: "60 min", descripcion: "Masaje de cuerpo completo para aliviar el estrés.", local_id: 3 },
  { id: 302, nombre: "Limpieza Facial Profunda", categoria: "Facial", precio: 45.00, duracion: "50 min", descripcion: "Limpieza y purificación profunda de la piel del rostro.", local_id: 3 },
  { id: 303, nombre: "Manicura y Pedicura Spa", categoria: "Uñas", precio: 30.00, duracion: "75 min", descripcion: "Cuidado completo de manos y pies con tratamientos de spa.", local_id: 3 }
];

// --- CAMBIO CLAVE AQUÍ: Datos iniciales para la tabla 'clientes' (SIN telefono ni email) ---
const initialClientesData = [
    { id: 1, nombre: "Juan", apellido: "Pérez", fecha_cita: "2025-07-25", hora_cita: "10:00:00", servicio_id: 101, trabajador_id: 1, local_id: 1, notas: "Cliente recurrente." },
    { id: 2, nombre: "María", apellido: "Gómez", fecha_cita: "2025-07-25", hora_cita: "14:30:00", servicio_id: 201, trabajador_id: 2, local_id: 2, notas: "Primera cita." }
];


const initializeDatabase = async () => {
    try {
        pool = mysql.createPool(dbConfig);
        console.log('Pool de conexiones MySQL creado.');

        const connection = await pool.getConnection();
        console.log('Conectado a la base de datos MySQL.');
        connection.release();

        // Crear la tabla de users
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

        // Crear la tabla de locales (con servicios JSON ELIMINADO)
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
                password VARCHAR(255)
            )
        `);
        console.log('Tabla de locales creada o ya existe.');

        // Crear la tabla de trabajadores (esquema actualizado)
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

        // Crear la tabla de servicios
        await pool.query(`
            CREATE TABLE IF NOT EXISTS servicios (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                categoria VARCHAR(100),
                precio DECIMAL(10, 2),
                duracion VARCHAR(50),
                descripcion TEXT,
                local_id BIGINT NOT NULL,
                FOREIGN KEY (local_id) REFERENCES locales(id) ON DELETE CASCADE
            )
        `);
        console.log('Tabla de servicios creada o ya existe.');

        // --- CAMBIO CLAVE AQUÍ: Crear la tabla de clientes (SIN telefono ni email) ---
        await pool.query(`
            CREATE TABLE IF NOT EXISTS clientes (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                apellido VARCHAR(255),
                -- telefono VARCHAR(50), ELIMINADO
                -- email VARCHAR(255), ELIMINADO
                fecha_cita DATE NOT NULL,
                hora_cita TIME NOT NULL,
                servicio_id BIGINT NOT NULL,
                trabajador_id BIGINT,
                local_id BIGINT NOT NULL,
                notas TEXT,
                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE,
                FOREIGN KEY (trabajador_id) REFERENCES trabajadores(id) ON DELETE SET NULL,
                FOREIGN KEY (local_id) REFERENCES locales(id) ON DELETE CASCADE
            );
        `);
        console.log('Tabla de clientes creada o ya existe.');


        // Inserción inicial para locales
        const [localesRowsCount] = await pool.query("SELECT COUNT(*) as count FROM locales");
        if (localesRowsCount[0].count === 0) {
            for (const local of initialLocalesData) {
                const [existing] = await pool.query('SELECT id FROM locales WHERE id = ?', [local.id]);
                if (existing.length === 0) {
                    await pool.query(
                        `INSERT INTO locales (id, type, nombre, direccion, telefono, horario, peluqueros, ingresosMes, clientesActivos, imagen, estado, username, password)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [local.id, local.type, local.nombre, local.direccion, local.telefono, local.horario, local.peluqueros, local.ingresosMes, local.clientesActivos, local.imagen, local.estado, local.username, local.password]
                    );
                }
            }
            console.log('Datos de locales por defecto insertados (o ya existían).');
        }

        // Inserción inicial para trabajadores
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
        
        // Inserción inicial para servicios
        const [serviciosRowsCount] = await pool.query("SELECT COUNT(*) as count FROM servicios");
        if (serviciosRowsCount[0].count === 0) {
            for (const servicio of initialServiciosData) {
                const [localExists] = await pool.query('SELECT id FROM locales WHERE id = ?', [servicio.local_id]);
                if (localExists.length > 0) {
                    await pool.query(
                        `INSERT INTO servicios (id, nombre, categoria, precio, duracion, descripcion, local_id)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [servicio.id, servicio.nombre, servicio.categoria, servicio.precio, servicio.duracion, servicio.descripcion, servicio.local_id]
                    );
                } else {
                    console.warn(`Advertencia: Local con ID ${servicio.local_id} no encontrado para el servicio ${servicio.nombre}. No se insertará este servicio.`);
                }
            }
            console.log('Datos de servicios por defecto insertados (o ya existían).');
        }

        // --- CAMBIO CLAVE AQUÍ: Inserción inicial para clientes (SIN telefono ni email) ---
        const [clientesRowsCount] = await pool.query("SELECT COUNT(*) as count FROM clientes");
        if (clientesRowsCount[0].count === 0) {
            for (const cliente of initialClientesData) {
                const [localExists] = await pool.query('SELECT id FROM locales WHERE id = ?', [cliente.local_id]);
                const [servicioExists] = await pool.query('SELECT id FROM servicios WHERE id = ?', [cliente.servicio_id]);
                const [trabajadorExists] = cliente.trabajador_id ? await pool.query('SELECT id FROM trabajadores WHERE id = ?', [cliente.trabajador_id]) : [null];

                if (localExists.length > 0 && servicioExists.length > 0 && (!cliente.trabajador_id || (trabajadorExists && trabajadorExists.length > 0))) { // Añadido check para trabajadorExists
                    await pool.query(
                        // NOTA: 'telefono' y 'email' ya no se incluyen aquí
                        `INSERT INTO clientes (id, nombre, apellido, fecha_cita, hora_cita, servicio_id, trabajador_id, local_id, notas)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [cliente.id, cliente.nombre, cliente.apellido, cliente.fecha_cita, cliente.hora_cita, cliente.servicio_id, cliente.trabajador_id, cliente.local_id, cliente.notas]
                    );
                } else {
                    console.warn(`Advertencia: No se pudo insertar cliente ${cliente.nombre} debido a IDs de local, servicio o trabajador no encontrados.`);
                }
            }
            console.log('Datos de clientes por defecto insertados (o ya existían).');
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