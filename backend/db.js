const mysql = require('mysql2/promise');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { crearEsquemaSeguridad } = require('./schema/seguridad');
const { crearEsquemaVentas } = require('./schema/ventas');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true, 
    connectionLimit: 10,       
    queueLimit: 0,
    connectTimeout: 10000
};

let pool; 

async function connectDB() { 
    try {
        pool = mysql.createPool(dbConfig); 
        
        const connection = await pool.getConnection();
        connection.release(); 
        console.log('Conectado a la base de datos MySQL (pool de conexiones).');

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id CHAR(36) PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL,
                local_id CHAR(36)
            )
        `);
        console.log('Tabla de users creada o ya existe.');

        // Migración: los usuarios con rol 'trabajador' apuntan a su registro en trabajadores
        const [colTrab] = await pool.query(
            "SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'trabajador_id'"
        );
        if (colTrab[0].n === 0) {
            await pool.execute('ALTER TABLE users ADD COLUMN trabajador_id CHAR(36) NULL');
            console.log('Columna users.trabajador_id agregada.');
        }

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS locales (
                id CHAR(36) PRIMARY KEY,
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

        // --- CORRECCIÓN CRÍTICA: Definición de la tabla 'trabajadores' ---
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS trabajadores (
                id CHAR(36) PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                apellido VARCHAR(255) NOT NULL,
                edad INT,                           
                dni VARCHAR(20) UNIQUE,             
                telefono VARCHAR(50),
                email VARCHAR(255),
                nacionalidad VARCHAR(100),          
                estado_civil VARCHAR(50),           
                fecha_ingreso DATE,
                nivel_estudios VARCHAR(255),        
                experiencia INT DEFAULT 0,          
                cantidad_hijos INT DEFAULT 0,       
                especialidad VARCHAR(255),
                valoracion DECIMAL(2, 1) DEFAULT 0.0, 
                clientes_atendidos INT DEFAULT 0,     
                ingreso_mensual DECIMAL(10, 2) DEFAULT 0.00, 
                foto VARCHAR(255),                  
                servicios JSON,                     
                local_id CHAR(36) NOT NULL,
                salario DECIMAL(10, 2) DEFAULT 0.00, 
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (local_id) REFERENCES locales(id) ON DELETE CASCADE
            );
        `);
        console.log('Tabla de trabajadores creada o ya existe.');

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS servicios (
                id CHAR(36) PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                categoria VARCHAR(100),
                precio DECIMAL(10, 2),
                duracion VARCHAR(50),
                descripcion TEXT,
                local_id CHAR(36) NOT NULL,
                FOREIGN KEY (local_id) REFERENCES locales(id) ON DELETE CASCADE
            )
        `);
        console.log('Tabla de servicios creada o ya existe.');

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS trabajador_servicio (
                trabajador_id CHAR(36) NOT NULL,
                servicio_id CHAR(36) NOT NULL,
                PRIMARY KEY (trabajador_id, servicio_id),
                FOREIGN KEY (trabajador_id) REFERENCES trabajadores(id) ON DELETE CASCADE,
                FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE
            );
        `);
        console.log('Tabla de trabajador_servicio creada o ya existe.');

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS cliente_spa (
                id CHAR(36) PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                apellido VARCHAR(255),
                fecha_cita DATE NOT NULL,
                hora_cita TIME NOT NULL,
                servicio_id CHAR(36) NOT NULL,
                trabajador_id CHAR(36),
                local_id CHAR(36) NOT NULL,
                notas TEXT,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE,
                FOREIGN KEY (trabajador_id) REFERENCES trabajadores(id) ON DELETE SET NULL,
                FOREIGN KEY (local_id) REFERENCES locales(id) ON DELETE CASCADE
            );
        `);
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS cliente_barberia (
                id CHAR(36) PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                apellido VARCHAR(255),
                fecha_cita DATE NOT NULL,
                hora_cita TIME NOT NULL,
                servicio_id CHAR(36) NOT NULL,
                trabajador_id CHAR(36),
                local_id CHAR(36) NOT NULL,
                notas TEXT,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE,
                FOREIGN KEY (trabajador_id) REFERENCES trabajadores(id) ON DELETE SET NULL,
                FOREIGN KEY (local_id) REFERENCES locales(id) ON DELETE CASCADE
            );
        `);
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS cliente_peluqueria (
                id CHAR(36) PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                apellido VARCHAR(255),
                fecha_cita DATE NOT NULL,
                hora_cita TIME NOT NULL,
                servicio_id CHAR(36) NOT NULL,
                trabajador_id CHAR(36),
                local_id CHAR(36) NOT NULL,
                notas TEXT,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE,
                FOREIGN KEY (trabajador_id) REFERENCES trabajadores(id) ON DELETE SET NULL,
                FOREIGN KEY (local_id) REFERENCES locales(id) ON DELETE CASCADE
            );
        `);
        console.log('Tablas de clientes (spa, barberia, peluqueria) creadas o ya existen.');


        await pool.execute(`
            CREATE TABLE IF NOT EXISTS productos (
                id CHAR(36) PRIMARY KEY,
                local_id CHAR(36) NOT NULL,
                nombre VARCHAR(255) NOT NULL,
                stock INT NOT NULL DEFAULT 0,
                stock_minimo INT NOT NULL DEFAULT 0,
                precio DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (local_id) REFERENCES locales(id) ON DELETE CASCADE
            );
        `);
        console.log('Tabla de productos (inventario) creada o ya existe.');

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS configuracion (
                clave VARCHAR(50) PRIMARY KEY,
                valor VARCHAR(255) NOT NULL DEFAULT ''
            );
        `);
        await pool.query(
            "INSERT IGNORE INTO configuracion (clave, valor) VALUES ('nombre_negocio', 'Koko'), ('email', ''), ('telefono', ''), ('direccion', '')"
        );


        // --- Insertar datos iniciales si no existen ---
        // Las claves numéricas de los datos semilla se traducen a UUID v4 (una sola vez por clave).
        const seedIds = new Map();
        const uuidFor = (kind, key) => {
            const k = `${kind}:${key}`;
            if (!seedIds.has(k)) seedIds.set(k, crypto.randomUUID());
            return seedIds.get(k);
        };

        const [userRows] = await pool.query("SELECT COUNT(*) as count FROM users");
        if (userRows[0].count === 0) {
            // Sin contraseñas por defecto conocidas: se generan al azar y se muestran una sola vez
            const credenciales = [['admin', 'admin', null], ['barberia', 'encargado', uuidFor('local', 1)],
                                  ['peluqueria', 'encargado', uuidFor('local', 2)], ['spa', 'encargado', uuidFor('local', 3)]];
            for (const [username, role, localId] of credenciales) {
                const clave = (username === 'admin' && process.env.ADMIN_PASSWORD) || crypto.randomBytes(12).toString('base64url');
                await pool.query("INSERT INTO users (id, username, password, role, local_id) VALUES (?, ?, ?, ?, ?)",
                    [crypto.randomUUID(), username, await bcrypt.hash(clave, 10), role, localId]);
                if (!(username === 'admin' && process.env.ADMIN_PASSWORD)) console.log(`Usuario inicial "${username}" — contraseña generada (cámbiala al ingresar): ${clave}`);
            }
            console.log('Usuarios por defecto insertados.');
        } 
        
        const [localesRowsCount] = await pool.execute('SELECT COUNT(*) AS count FROM locales');
        if (localesRowsCount[0].count === 0) {
            const initialLocalesData = [
                { id: 1, type: "barberia", nombre: "Barberia Koko", direccion: "Av. Principal 123, Centro", telefono: "+52 55 1234-5678", horario: "Lun-Sab 9:00-20:00", peluqueros: 5, ingresosMes: 85000, clientesActivos: 142, imagen: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&h=200&fit=crop", estado: "Activo", username: "barberia", password: "barberia" },
                { id: 2, type: "peluqueria", nombre: "Peluqueria Koko", direccion: "Blvd. Norte 456, Zona Norte", telefono: "+52 55 2345-6789", horario: "Lun-Dom 8:00-21:00", peluqueros: 7, ingresosMes: 92000, clientesActivos: 186, imagen: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=300&h=200&fit=crop", estado: "Activo", username: "peluqueria", password: "peluqueria" },
                { id: 3, type: "spa", nombre: "Spa Koko", direccion: "Col. Sur 789, Zona Sur", telefono: "+52 55 3456-7890", horario: "Lun-Sab 10:00-19:00", peluqueros: 4, ingresosMes: 67000, clientesActivos: 98, imagen: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=300&h=200&fit=fit", estado: "Activo", username: "spa", password: "spa" }
            ];

            for (const local of initialLocalesData) {
                const localUuid = uuidFor('local', local.id);
                const [existing] = await pool.query('SELECT id FROM locales WHERE id = ?', [localUuid]);
                if (existing.length === 0) {
                    await pool.query(
                        `INSERT INTO locales (id, type, nombre, direccion, telefono, horario, peluqueros, ingresosMes, clientesActivos, imagen, estado, username, password)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [localUuid, local.type, local.nombre, local.direccion, local.telefono, local.horario, local.peluqueros, local.ingresosMes, local.clientesActivos, local.imagen, local.estado, local.username, '']
                    );
                }
            }
            console.log('Datos de locales por defecto insertados (o ya existían).');
        }

        const [trabajadores_count] = await pool.execute('SELECT COUNT(*) AS count FROM trabajadores');
        if (trabajadores_count[0].count === 0) {
            // CORRECCIÓN CRÍTICA: Datos iniciales de trabajadores completos y con nombres de DB
            const initialTrabajadoresData = [
                { id: 1, nombre: "María", apellido: "González", edad: 30, dni: "12345678A", telefono: "+52 55 1111-1111", email: "maria.g@example.com", nacionalidad: "Mexicana", estado_civil: "Soltera", fecha_ingreso: "2017-03-15", nivel_estudios: "Grado Superior", experiencia: 8, cantidad_hijos: 0, especialidad: "Corte y Color", valoracion: 4.9, clientes_atendidos: 1248, ingreso_mensual: 28000.00, foto: "https://images.unsplash.com/photo-1594824475325-7014831b4902?w=150&h=150&fit=crop&crop=face", servicios: ["Corte Clásico", "Coloración", "Mechas", "Tratamientos"], local_id: 1, salario: 1200.00 },
                { id: 2, nombre: "Carlos", apellido: "Mendoza", edad: 45, dni: "87654321B", telefono: "+52 55 2222-2222", email: "carlos.m@example.com", nacionalidad: "Colombiana", estado_civil: "Casado", fecha_ingreso: "2010-06-01", nivel_estudios: "Licenciatura", experiencia: 12, cantidad_hijos: 2, especialidad: "Barbería Clásica", valoracion: 4.8, clientes_atendidos: 2156, ingreso_mensual: 32000.00, foto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face", servicios: ["Corte Clásico", "Barba", "Bigote", "Afeitado"], local_id: 2, salario: 1500.00 },
                { id: 3, nombre: "Ana", apellido: "Rodríguez", edad: 28, dni: "13579246C", telefono: "+52 55 3333-3333", email: "ana.r@example.com", nacionalidad: "Mexicana", estado_civil: "Soltera", fecha_ingreso: "2019-01-10", nivel_estudios: "Técnico", experiencia: 6, cantidad_hijos: 0, especialidad: "Estilismo Avanzado", valoracion: 4.7, clientes_atendidos: 896, ingreso_mensual: 24000.00, foto: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face", servicios: ["Peinados", "Ondulado", "Alisado", "Eventos"], local_id: 1, salario: 1000.00 },
                { id: 4, nombre: "Roberto", apellido: "Silva", edad: 35, dni: "24680135D", telefono: "+52 55 4444-4444", email: "roberto.s@example.com", nacionalidad: "Peruana", estado_civil: "Casado", fecha_ingreso: "2021-09-01", nivel_estudios: "Bachillerato", experiencia: 4, cantidad_hijos: 1, especialidad: "Corte Moderno", valoracion: 4.6, clientes_atendidos: 672, ingreso_mensual: 21000.00, foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face", servicios: ["Corte Fade", "Undercut", "Pompadour", "Texturizado"], local_id: 3, salario: 900.00 },
                { id: 5, nombre: "Laura", apellido: "Jiménez", edad: 40, dni: "98765432E", telefono: "+52 55 5555-5555", email: "laura.j@example.com", nacionalidad: "Española", estado_civil: "Divorciada", fecha_ingreso: "2015-02-20", nivel_estudios: "Doctorado", experiencia: 10, cantidad_hijos: 3, especialidad: "Color Especialista", valoracion: 4.9, clientes_atendidos: 1432, ingreso_mensual: 30000.00, foto: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face", servicios: ["Balayage", "Highlights", "Color Fantasy", "Corrección"], local_id: 2, salario: 1800.00 }
            ];

            for (const trabajador of initialTrabajadoresData) {
                const localUuid = uuidFor('local', trabajador.local_id);
                const [localExists] = await pool.query('SELECT id FROM locales WHERE id = ?', [localUuid]);
                if (localExists.length > 0) {
                    await pool.query(
                        `INSERT INTO trabajadores (id, nombre, apellido, edad, dni, telefono, email, nacionalidad, estado_civil, fecha_ingreso, nivel_estudios, experiencia, cantidad_hijos, especialidad, valoracion, clientes_atendidos, ingreso_mensual, foto, servicios, local_id, salario)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, // 21 placeholders
                        [
                            uuidFor('trabajador', trabajador.id), trabajador.nombre, trabajador.apellido, trabajador.edad, trabajador.dni,
                            trabajador.telefono, trabajador.email, trabajador.nacionalidad, trabajador.estado_civil,
                            trabajador.fecha_ingreso, trabajador.nivel_estudios, trabajador.experiencia,
                            trabajador.cantidad_hijos, trabajador.especialidad, trabajador.valoracion,
                            trabajador.clientes_atendidos, trabajador.ingreso_mensual, trabajador.foto,
                            JSON.stringify(trabajador.servicios), localUuid, trabajador.salario
                        ]
                    );
                } else {
                    console.warn(`Advertencia: Local con ID ${trabajador.local_id} no encontrado para el trabajador ${trabajador.nombre}. No se insertará este trabajador.`);
                }
            }
            console.log('Datos de trabajadores por defecto insertados (o ya existían).');
        }
        
        const [servicios_count] = await pool.execute('SELECT COUNT(*) AS count FROM servicios');
        if (servicios_count[0].count === 0) {
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

            for (const servicio of initialServiciosData) {
                const localUuid = uuidFor('local', servicio.local_id);
                const [localExists] = await pool.query('SELECT id FROM locales WHERE id = ?', [localUuid]);
                if (localExists.length > 0) {
                    await pool.query(
                        `INSERT INTO servicios (id, nombre, categoria, precio, duracion, descripcion, local_id)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [uuidFor('servicio', servicio.id), servicio.nombre, servicio.categoria, servicio.precio, servicio.duracion, servicio.descripcion, localUuid]
                    );
                } else {
                    console.warn(`Advertencia: Local con ID ${servicio.local_id} no encontrado para el servicio ${servicio.nombre}. No se insertará este servicio.`);
                }
            }
            console.log('Datos de servicios por defecto insertados (o ya existían).');
        }

        const [productosCount] = await pool.execute('SELECT COUNT(*) AS count FROM productos');
        if (productosCount[0].count === 0) {
            const productosIniciales = [
                ['barberia', 'Shampoo Profesional', 45, 10, 180], ['barberia', 'Cera Modeladora', 18, 6, 120], ['barberia', 'Aceite para Barba', 3, 5, 95],
                ['peluqueria', 'Shampoo Profesional', 38, 10, 180], ['peluqueria', 'Tinte Castaño', 15, 8, 350], ['peluqueria', 'Mascarilla Reparadora', 4, 6, 280],
                ['spa', 'Aceite de Masaje', 22, 5, 85], ['spa', 'Crema Facial', 6, 4, 140], ['spa', 'Esmalte de Uñas', 0, 2, 25]
            ];
            for (const [tipo, nombre, stock, minimo, precio] of productosIniciales) {
                const [locs] = await pool.query('SELECT id FROM locales WHERE type = ? ORDER BY id LIMIT 1', [tipo]);
                if (locs.length === 0) continue;
                await pool.query(
                    'INSERT INTO productos (id, local_id, nombre, stock, stock_minimo, precio) VALUES (?, ?, ?, ?, ?, ?)',
                    [crypto.randomUUID(), locs[0].id, nombre, stock, minimo, precio]
                );
            }
            console.log('Inventario inicial insertado.');
        }

        const [trabajadorServicioCount] = await pool.execute('SELECT COUNT(*) AS count FROM trabajador_servicio');
        if (trabajadorServicioCount[0].count === 0) {
            const pares = [[1, 101], [1, 102], [2, 201], [2, 202], [3, 301], [3, 302], [1, 103], [2, 203], [3, 303]];
            for (const [t, sv] of pares) {
                await pool.execute(
                    'INSERT INTO trabajador_servicio (trabajador_id, servicio_id) VALUES (?, ?)',
                    [uuidFor('trabajador', t), uuidFor('servicio', sv)]
                );
            }
            console.log('Asignación inicial de trabajadores a servicios completada.');
        }

        const [clientesRowsCount] = await pool.query("SELECT COUNT(*) as count FROM cliente_barberia UNION ALL SELECT COUNT(*) FROM cliente_peluqueria UNION ALL SELECT COUNT(*) FROM cliente_spa");
        if (clientesRowsCount[0].count === 0) {
            const initialClientesData = [
                { id: 1, nombre: "Juan", apellido: "Pérez", fecha_cita: "2025-07-25", hora_cita: "10:00:00", servicio_id: 101, trabajador_id: 1, local_id: 1, notas: "Cliente recurrente." },
                { id: 2, nombre: "María", apellido: "Gómez", fecha_cita: "2025-07-25", hora_cita: "14:30:00", servicio_id: 201, trabajador_id: 2, local_id: 2, notas: "Primera cita." },
                { id: 3, nombre: "Carlos", apellido: "Ruiz", fecha_cita: "2025-07-26", hora_cita: "09:00:00", servicio_id: 301, trabajador_id: 3, local_id: 3, notas: "Visita de spa." }
            ];

            for (const cliente of initialClientesData) {
                const localUuid = uuidFor('local', cliente.local_id);
                const servicioUuid = uuidFor('servicio', cliente.servicio_id);
                const trabajadorUuid = cliente.trabajador_id ? uuidFor('trabajador', cliente.trabajador_id) : null;
                const [localExists] = await pool.query('SELECT id, type FROM locales WHERE id = ?', [localUuid]);
                const [servicioExists] = await pool.query('SELECT id FROM servicios WHERE id = ?', [servicioUuid]);
                const [trabajadorExists] = trabajadorUuid ? await pool.query('SELECT id FROM trabajadores WHERE id = ?', [trabajadorUuid]) : [null];

                if (localExists.length > 0 && servicioExists.length > 0 && (!cliente.trabajador_id || (trabajadorExists && trabajadorExists.length > 0))) {
                    const localType = localExists[0].type;
                    let tableName;
                    switch (localType) {
                        case 'barberia': tableName = 'cliente_barberia'; break;
                        case 'peluqueria': tableName = 'cliente_peluqueria'; break;
                        case 'spa': tableName = 'cliente_spa'; break;
                        default:
                            console.warn(`Advertencia: Tipo de local desconocido para cliente ${cliente.nombre}.`);
                            continue; 
                    }

                    await pool.query(
                        `INSERT INTO ${tableName} (id, nombre, apellido, fecha_cita, hora_cita, servicio_id, trabajador_id, local_id, notas)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [crypto.randomUUID(), cliente.nombre, cliente.apellido, cliente.fecha_cita, cliente.hora_cita, servicioUuid, trabajadorUuid, localUuid, cliente.notas]
                    );
                } else {
                    console.warn(`Advertencia: No se pudo insertar cliente ${cliente.nombre} debido a IDs de local, servicio o trabajador no encontrados.`);
                }
            }
            console.log('Datos de clientes por defecto insertados (o ya existían).');
        }


        // Roles, permisos, historial de trabajadores por local, horarios y apariencia
        await crearEsquemaSeguridad(pool);
        await crearEsquemaVentas(pool);

        // Migración de seguridad: contraseñas en texto plano -> hash bcrypt
        const [planas] = await pool.query("SELECT id, password FROM users WHERE password NOT LIKE '$2%'");
        for (const u of planas) {
            await pool.query('UPDATE users SET password = ? WHERE id = ?', [await bcrypt.hash(u.password, 10), u.id]);
        }
        if (planas.length > 0) console.log(`Contraseñas migradas a hash: ${planas.length}.`);
        // La tabla locales ya no guarda contraseñas (viven, con hash, en users)
        await pool.query("UPDATE locales SET password = '' WHERE password <> ''");

    } catch (err) {
        console.error('Error al inicializar la base de datos:', err.message);
        process.exit(1);
    }
};

const getDB = () => {
    if (!pool) {
        throw new Error('La base de datos no ha sido inicializada. Llama a connectDB() primero.');
    }
    return pool;
};

module.exports = { connectDB, getDB };