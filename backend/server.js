// backend/server.js

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Datos de locales para insertar inicialmente
const initialLocalesData = [
  {
    id: 1,
    type: "barberia",
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
    password: "barberia",
    servicios: ["Corte Clásico", "Afeitado con Toalla Caliente", "Diseño de Barba", "Tratamiento Capilar"]
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
    password: "peluqueria",
    servicios: ["Corte de Dama", "Tinte y Mechas", "Peinado para Eventos", "Manicura y Pedicura"]
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
    imagen: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=300&h=200&fit=fit",
    estado: "Activo",
    username: "spa",
    password: "spa",
    servicios: ["Masaje Relajante", "Limpieza Facial Profunda", "Exfoliación Corporal", "Aromaterapia"]
  }
];

// Datos iniciales para la tabla 'trabajadores'
const initialTrabajadoresData = [
    {
      id: 1,
      nombre: "María",
      apellido: "González",
      edad: 30,
      dni: "12345678A",
      telefono: "+52 55 1111-1111",
      nacionalidad: "Mexicana",
      estado_civil: "Soltera",
      fecha_ingreso: "2017-03-15",
      nivel_estudios: "Grado Superior",
      experiencia: 8,
      cantidad_hijos: 0,
      especialidad: "Corte y Color",
      rating: 4.9,
      clientesAtendidos: 1248,
      ingresosMes: 28000,
      foto: "https://images.unsplash.com/photo-1594824475325-7014831b4902?w=150&h=150&fit=crop&crop=face",
      servicios: ["Corte Clásico", "Coloración", "Mechas", "Tratamientos"],
      local_id: 1
    },
    {
      id: 2,
      nombre: "Carlos",
      apellido: "Mendoza",
      edad: 45,
      dni: "87654321B",
      telefono: "+52 55 2222-2222",
      nacionalidad: "Colombiana",
      estado_civil: "Casado",
      fecha_ingreso: "2010-06-01",
      nivel_estudios: "Licenciatura",
      experiencia: 12,
      cantidad_hijos: 2,
      especialidad: "Barbería Clásica",
      rating: 4.8,
      clientesAtendidos: 2156,
      ingresosMes: 32000,
      foto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      servicios: ["Corte Clásico", "Barba", "Bigote", "Afeitado"],
      local_id: 2
    },
    {
      id: 3,
      nombre: "Ana",
      apellido: "Rodríguez",
      edad: 28,
      dni: "13579246C",
      telefono: "+52 55 3333-3333",
      nacionalidad: "Mexicana",
      estado_civil: "Soltera",
      fecha_ingreso: "2019-01-10",
      nivel_estudios: "Técnico",
      experiencia: 6,
      cantidad_hijos: 0,
      especialidad: "Estilismo Avanzado",
      rating: 4.7,
      clientesAtendidos: 896,
      ingresosMes: 24000,
      foto: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      servicios: ["Peinados", "Ondulado", "Alisado", "Eventos"],
      local_id: 1
    },
    {
        id: 4,
        nombre: "Roberto",
        apellido: "Silva",
        edad: 35,
        dni: "24680135D",
        telefono: "+52 55 4444-4444",
        nacionalidad: "Peruana",
        estado_civil: "Casado",
        fecha_ingreso: "2021-09-01",
        nivel_estudios: "Bachillerato",
        experiencia: 4,
        cantidad_hijos: 1,
        especialidad: "Corte Moderno",
        rating: 4.6,
        clientesAtendidos: 672,
        ingresosMes: 21000,
        foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        servicios: ["Corte Fade", "Undercut", "Pompadour", "Texturizado"],
        local_id: 3
    },
    {
        id: 5,
        nombre: "Laura",
        apellido: "Jiménez",
        edad: 40,
        dni: "98765432E",
        telefono: "+52 55 5555-5555",
        nacionalidad: "Española",
        estado_civil: "Divorciada",
        fecha_ingreso: "2015-02-20",
        nivel_estudios: "Doctorado",
        experiencia: 10,
        cantidad_hijos: 3,
        especialidad: "Color Especialista",
        rating: 4.9,
        clientesAtendidos: 1432,
        ingresosMes: 30000,
        foto: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
        servicios: ["Balayage", "Highlights", "Color Fantasy", "Corrección"],
        local_id: 2
    }
];


// Configuración de la conexión a la base de datos MySQL
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'peluqueria',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let pool;

async function initializeDatabase() {
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
        console.log('Tabla de usuarios creada o ya existe en MySQL.');

        // Insertar usuarios por defecto si la tabla de users está vacía
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
        console.log('Tabla de locales creada o ya existe en MySQL.');

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
        console.log('Tabla de trabajadores creada o ya existe en MySQL.');

        // LÓGICA DE INSERCIÓN INICIAL PARA LOCALES (sin cambios)
        for (const local of initialLocalesData) {
            const [existing] = await pool.query('SELECT id FROM locales WHERE id = ?', [local.id]);
            if (existing.length === 0) {
                await pool.query(
                    `INSERT INTO locales (id, type, nombre, direccion, telefono, horario, peluqueros, ingresosMes, clientesActivos, imagen, estado, username, password, servicios)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        local.id,
                        local.type,
                        local.nombre,
                        local.direccion,
                        local.telefono,
                        local.horario,
                        local.peluqueros,
                        local.ingresosMes,
                        local.clientesActivos,
                        local.imagen,
                        local.estado,
                        local.username,
                        local.password,
                        JSON.stringify(local.servicios)
                    ]
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
                        [
                            trabajador.id,
                            trabajador.nombre,
                            trabajador.apellido,
                            trabajador.edad,
                            trabajador.dni,
                            trabajador.telefono,
                            trabajador.nacionalidad,
                            trabajador.estado_civil,
                            trabajador.fecha_ingreso,
                            trabajador.nivel_estudios,
                            trabajador.experiencia,
                            trabajador.cantidad_hijos,
                            trabajador.especialidad,
                            trabajador.rating,
                            trabajador.clientesAtendidos,
                            trabajador.ingresosMes,
                            trabajador.foto,
                            JSON.stringify(trabajador.servicios),
                            trabajador.local_id
                        ]
                    );
                } else {
                    console.warn(`Advertencia: Local con ID ${trabajador.local_id} no encontrado para el trabajador ${trabajador.nombre}. No se insertará este trabajador.`);
                }
            }
            console.log('Datos de trabajadores por defecto insertados en MySQL (o ya existían).');
        }


    } catch (err) {
        console.error('Error al inicializar la base de datos MySQL:', err.message);
        process.exit(1);
    }
}

initializeDatabase();


// Rutas de la API

// Ruta de login (sin cambios)
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Nombre de usuario y contraseña son requeridos.' });
    }

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        const user = rows[0];
        res.json({
            message: 'Login exitoso',
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                local_id: user.local_id
            }
        });
    } catch (err) {
        console.error('Error en la consulta de login:', err.message);
        res.status(500).json({ message: 'Error del servidor.' });
    }
});

// Ruta para obtener todos los usuarios (sin cambios)
app.get('/api/users', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, username, role, local_id FROM users');
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener usuarios:', err.message);
        res.status(500).json({ message: 'Error del servidor.' });
    }
});

// GET /api/locales (con conversión de tipos)
app.get('/api/locales', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, type, nombre, direccion, telefono, horario, peluqueros, ingresosMes, clientesActivos, imagen, estado, username, password, servicios FROM locales');
        const locales = rows.map(row => ({
            ...row,
            peluqueros: parseInt(row.peluqueros, 10),
            ingresosMes: parseFloat(row.ingresosMes),
            clientesActivos: parseInt(row.clientesActivos, 10),
            servicios: JSON.parse(row.servicios)
        }));
        res.json(locales);
    } catch (err) {
        console.error('Error al obtener locales:', err.message);
        res.status(500).json({ message: 'Error del servidor.' });
    }
});

// GET /api/locales/:id (con conversión de tipos)
app.get('/api/locales/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT id, type, nombre, direccion, telefono, horario, peluqueros, ingresosMes, clientesActivos, imagen, estado, username, password, servicios FROM locales WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Local no encontrado.' });
        }
        const local = {
            ...rows[0],
            peluqueros: parseInt(rows[0].peluqueros, 10),
            ingresosMes: parseFloat(rows[0].ingresosMes),
            clientesActivos: parseInt(rows[0].clientesActivos, 10),
            servicios: JSON.parse(rows[0].servicios)
        };
        res.json(local);
    } catch (err) {
        console.error('Error al obtener local por ID:', err.message);
        res.status(500).json({ message: 'Error del servidor.' });
    }
});

// POST para crear un nuevo local (sin cambios)
app.post('/api/locales', async (req, res) => {
    const { type, nombre, direccion, telefono, horario, peluqueros, ingresosMes, clientesActivos, imagen, estado, username, password, servicios } = req.body;

    if (!nombre || !username || !password) {
        return res.status(400).json({ message: 'Nombre, usuario y contraseña del local son obligatorios.' });
    }

    let newLocalId;

    try {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // 1. Insertar el local en la tabla 'locales'
            const [localResult] = await connection.query(
                `INSERT INTO locales (type, nombre, direccion, telefono, horario, peluqueros, ingresosMes, clientesActivos, imagen, estado, username, password, servicios)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    type || 'peluqueria',
                    nombre,
                    direccion || null,
                    telefono || null,
                    horario || null,
                    peluqueros || 0,
                    ingresosMes || 0,
                    clientesActivos || 0,
                    imagen || null,
                    estado || 'Activo',
                    username,
                    password,
                    JSON.stringify(servicios || [])
                ]
            );

            newLocalId = localResult.insertId;

            // 2. Insertar también en la tabla 'users'
            await connection.query(
                `INSERT INTO users (username, password, role, local_id)
                 VALUES (?, ?, ?, ?)`,
                [username, password, 'encargado', newLocalId]
            );

            await connection.commit();

            // Recuperar el local completo de la DB para devolverlo al frontend
            const [newLocalRows] = await pool.query('SELECT * FROM locales WHERE id = ?', [newLocalId]);
            const newLocal = {
                ...newLocalRows[0],
                peluqueros: parseInt(newLocalRows[0].peluqueros, 10),
                ingresosMes: parseFloat(newLocalRows[0].ingresosMes),
                clientesActivos: parseInt(newLocalRows[0].clientesActivos, 10),
                servicios: JSON.parse(newLocalRows[0].servicios)
            };
            res.status(201).json(newLocal);

        } catch (transactionError) {
            await connection.rollback();
            throw transactionError;
        } finally {
            connection.release();
        }

    } catch (err) {
        console.error('Error al crear nuevo local o usuario:', err.message);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Error: El nombre de usuario para este local ya existe o el nombre del local ya está en uso. Por favor, elige otro.' });
        }
        res.status(500).json({ message: 'Error del servidor al crear local o usuario.' });
    }
});

// DELETE para eliminar un local (incluye eliminación de usuario y trabajadores) (sin cambios)
app.delete('/api/locales/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // 1. Eliminar trabajadores asociados a este local_id
            await connection.query('DELETE FROM trabajadores WHERE local_id = ?', [id]);
            console.log(`Trabajadores del local ${id} eliminados.`);

            // 2. Eliminar el usuario asociado a este local_id
            await connection.query('DELETE FROM users WHERE local_id = ?', [id]);
            console.log(`Usuario del local ${id} eliminado.`);
            
            // 3. Eliminar el local de la tabla 'locales'
            const [localDeleteResult] = await connection.query('DELETE FROM locales WHERE id = ?', [id]);

            if (localDeleteResult.affectedRows === 0) {
                await connection.rollback();
                return res.status(404).json({ message: 'Local no encontrado para eliminar.' });
            }

            await connection.commit();

            res.status(200).json({ message: 'Local, usuario y trabajadores asociados eliminados exitosamente.' });

        } catch (transactionError) {
            await connection.rollback();
            throw transactionError;
        } finally {
            connection.release();
        }

    } catch (err) {
        console.error('Error al eliminar local y/o usuario/trabajadores:', err.message);
        res.status(500).json({ message: 'Error del servidor al eliminar local y/o usuario/trabajadores.' });
    }
});

// GET para obtener todos los trabajadores (con conversión de tipos)
app.get('/api/trabajadores', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM trabajadores');
        const trabajadores = rows.map(row => ({
            ...row,
            rating: parseFloat(row.rating),
            ingresosMes: parseFloat(row.ingresosMes),
            clientesAtendidos: parseInt(row.clientesAtendidos, 10),
            experiencia: parseInt(row.experiencia, 10), // Convertir experiencia a número
            edad: parseInt(row.edad, 10), // Convertir edad a número
            cantidad_hijos: parseInt(row.cantidad_hijos, 10), // Convertir cantidad_hijos a número
            // La fecha de ingreso es tipo DATE, puede necesitar formateo en el frontend
            servicios: JSON.parse(row.servicios)
        }));
        res.json(trabajadores);
    } catch (err) {
        console.error('Error al obtener trabajadores:', err.message);
        res.status(500).json({ message: 'Error del servidor.' });
    }
});


// --- CAMBIO CLAVE AQUÍ: NUEVA RUTA DELETE para eliminar un TRABAJADOR por su ID ---
app.delete('/api/trabajadores/:id', async (req, res) => {
    const { id } = req.params; // ID del trabajador a eliminar

    try {
        const [result] = await pool.query('DELETE FROM trabajadores WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Trabajador no encontrado para eliminar.' });
        }
        res.status(200).json({ message: 'Trabajador eliminado exitosamente.' });

    } catch (err) {
        console.error('Error al eliminar trabajador:', err.message);
        res.status(500).json({ message: 'Error del servidor al eliminar trabajador.' });
    }
});

// POST para crear un nuevo trabajador
app.post('/api/trabajadores', async (req, res) => {
    const { nombre, especialidad, telefono, experiencia, rating, clientesAtendidos, ingresosMes, foto, servicios, local_id } = req.body;
    const { apellido, edad, dni, nacionalidad, estado_civil, fecha_ingreso, nivel_estudios, cantidad_hijos } = req.body;

    if (!nombre || !apellido || !especialidad || !local_id || !dni || !fecha_ingreso) {
        return res.status(400).json({ message: 'Nombre, apellido, especialidad, DNI, fecha de ingreso y ID del local son obligatorios para el trabajador.' });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO trabajadores (nombre, apellido, edad, dni, telefono, nacionalidad, estado_civil, fecha_ingreso, nivel_estudios, experiencia, cantidad_hijos, especialidad, rating, clientesAtendidos, ingresosMes, foto, servicios, local_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nombre,
                apellido,
                edad || null,
                dni,
                telefono || null,
                nacionalidad || null,
                estado_civil || null,
                fecha_ingreso,
                nivel_estudios || null,
                experiencia || 0,
                cantidad_hijos || 0,
                especialidad,
                rating || 0,
                clientesAtendidos || 0,
                ingresosMes || 0,
                foto || null,
                JSON.stringify(servicios || []),
                local_id
            ]
        );

        const newTrabajadorId = result.insertId;
        const [newTrabajadorRows] = await pool.query('SELECT * FROM trabajadores WHERE id = ?', [newTrabajadorId]);
        const newTrabajador = {
            ...newTrabajadorRows[0],
            edad: parseInt(newTrabajadorRows[0].edad, 10),
            experiencia: parseInt(newTrabajadorRows[0].experiencia, 10),
            cantidad_hijos: parseInt(newTrabajadorRows[0].cantidad_hijos, 10),
            rating: parseFloat(newTrabajadorRows[0].rating),
            clientesAtendidos: parseInt(newTrabajadorRows[0].clientesAtendidos, 10),
            ingresosMes: parseFloat(newTrabajadorRows[0].ingresosMes),
            servicios: JSON.parse(newTrabajadorRows[0].servicios),
            // Formatear la fecha para que el frontend la reciba como string YYYY-MM-DD
            fecha_ingreso: newTrabajadorRows[0].fecha_ingreso ? newTrabajadorRows[0].fecha_ingreso.toISOString().split('T')[0] : null
        };
        res.status(201).json(newTrabajador);

    } catch (err) {
        console.error('Error al crear nuevo trabajador:', err.message);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Error: El DNI o algún otro campo único del trabajador ya existe.' });
        }
        res.status(500).json({ message: 'Error del servidor al crear trabajador.' });
    }
});


// Iniciar el servidor (sin cambios)
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});