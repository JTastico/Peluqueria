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
    id: 1, // Estos IDs se mantendrán si no hay conflicto y el AUTO_INCREMENT se ajustará
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
    servicios: ["Corte Clásico", "Afeitado con Toalla Caliente", "Diseño de Barba", "Tratamiento Capilar"],
    trabajadores: ["Javier Paredes", "Roberto Silva", "Miguel Torres"]
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
    servicios: ["Corte de Dama", "Tinte y Mechas", "Peinado para Eventos", "Manicura y Pedicura"],
    trabajadores: ["Ana Rodríguez", "Luisa Fernandez", "Verónica Solis"]
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
    servicios: ["Masaje Relajante", "Limpieza Facial Profunda", "Exfoliación Corporal", "Aromaterapia"],
    trabajadores: ["Laura Jiménez", "Marta Rivas", "Carlos Mendoza"]
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
                local_id INT
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

        // --- CAMBIO CLAVE AQUÍ: 'id' ahora es BIGINT AUTO_INCREMENT PRIMARY KEY ---
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
                servicios JSON,
                trabajadores JSON
            )
        `);
        console.log('Tabla de locales creada o ya existe en MySQL.');

        // --- LÓGICA DE INSERCIÓN INICIAL PARA LOCALES (mantiene IDs existentes si los hay) ---
        for (const local of initialLocalesData) {
            const [existing] = await pool.query('SELECT id FROM locales WHERE id = ?', [local.id]);
            if (existing.length === 0) { // Solo inserta si no existe ya un local con ese ID
                await pool.query(
                    `INSERT INTO locales (id, type, nombre, direccion, telefono, horario, peluqueros, ingresosMes, clientesActivos, imagen, estado, username, password, servicios, trabajadores)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
                        JSON.stringify(local.servicios),
                        JSON.stringify(local.trabajadores)
                    ]
                );
            }
        }
        console.log('Datos de locales por defecto insertados en MySQL (o ya existían).');


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

// Ruta para obtener todos los locales (sin cambios)
app.get('/api/locales', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM locales');
        const locales = rows.map(row => ({
            ...row,
            servicios: JSON.parse(row.servicios),
            trabajadores: JSON.parse(row.trabajadores)
        }));
        res.json(locales);
    } catch (err) {
        console.error('Error al obtener locales:', err.message);
        res.status(500).json({ message: 'Error del servidor.' });
    }
});

// Ruta para obtener un local por ID (sin cambios)
app.get('/api/locales/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM locales WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Local no encontrado.' });
        }
        const local = {
            ...rows[0],
            servicios: JSON.parse(rows[0].servicios),
            trabajadores: JSON.parse(rows[0].trabajadores)
        };
        res.json(local);
    } catch (err) {
        console.error('Error al obtener local por ID:', err.message);
        res.status(500).json({ message: 'Error del servidor.' });
    }
});

// POST para crear un nuevo local (incluye inserción en tabla users)
app.post('/api/locales', async (req, res) => {
    const { type, nombre, direccion, telefono, horario, peluqueros, ingresosMes, clientesActivos, imagen, estado, username, password, servicios, trabajadores } = req.body;

    if (!nombre || !username || !password) {
        return res.status(400).json({ message: 'Nombre, usuario y contraseña del local son obligatorios.' });
    }

    let newLocalId;

    try {
        // Iniciar una transacción para asegurar la consistencia
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // 1. Insertar el local en la tabla 'locales'
            const [localResult] = await connection.query(
                `INSERT INTO locales (type, nombre, direccion, telefono, horario, peluqueros, ingresosMes, clientesActivos, imagen, estado, username, password, servicios, trabajadores)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
                    JSON.stringify(servicios || []),
                    JSON.stringify(trabajadores || [])
                ]
            );

            newLocalId = localResult.insertId; // Obtener el ID autoincrementado del nuevo local

            // 2. Insertar también en la tabla 'users'
            await connection.query(
                `INSERT INTO users (username, password, role, local_id)
                 VALUES (?, ?, ?, ?)`,
                [username, password, 'encargado', newLocalId]
            );

            await connection.commit(); // Confirmar la transacción

            // Recuperar el local completo de la DB para devolverlo al frontend
            const [newLocalRows] = await pool.query('SELECT * FROM locales WHERE id = ?', [newLocalId]);
            const newLocal = {
                ...newLocalRows[0],
                servicios: JSON.parse(newLocalRows[0].servicios),
                trabajadores: JSON.parse(newLocalRows[0].trabajadores)
            };
            res.status(201).json(newLocal);

        } catch (transactionError) {
            await connection.rollback(); // Deshacer la transacción si hay un error
            throw transactionError; // Relanzar el error para que sea capturado por el catch externo
        } finally {
            connection.release(); // Liberar la conexión
        }

    } catch (err) {
        console.error('Error al crear nuevo local o usuario:', err.message);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Error: El nombre de usuario para este local ya existe o el nombre del local ya está en uso. Por favor, elige otro.' });
        }
        res.status(500).json({ message: 'Error del servidor al crear local o usuario.' });
    }
});

// --- CAMBIO CLAVE AQUÍ: DELETE para eliminar un local (incluye eliminación de usuario) ---
app.delete('/api/locales/:id', async (req, res) => {
    const { id } = req.params; // Este es el local_id

    try {
        const connection = await pool.getConnection();
        await connection.beginTransaction(); // Iniciar transacción

        try {
            // 1. Eliminar el usuario asociado a este local_id
            const [userDeleteResult] = await connection.query('DELETE FROM users WHERE local_id = ?', [id]);
            
            // Opcional: Podrías verificar userDeleteResult.affectedRows para saber si se eliminó un usuario.
            if (userDeleteResult.affectedRows === 0) {
                console.log(`Advertencia: No se encontró usuario para el local_id ${id} al eliminar.`);
                // Podrías devolver 404 si es estrictamente necesario que siempre haya un usuario
                // Pero es mejor continuar y eliminar el local si el usuario no existe.
            }

            // 2. Eliminar el local de la tabla 'locales'
            const [localDeleteResult] = await connection.query('DELETE FROM locales WHERE id = ?', [id]);

            if (localDeleteResult.affectedRows === 0) {
                // Si no se encontró el local, deshacemos la eliminación del usuario (si la hubo)
                await connection.rollback();
                return res.status(404).json({ message: 'Local no encontrado para eliminar.' });
            }

            await connection.commit(); // Confirmar la transacción

            res.status(200).json({ message: 'Local y usuario asociados eliminados exitosamente.' });

        } catch (transactionError) {
            await connection.rollback(); // Deshacer la transacción si hay un error
            throw transactionError; // Relanzar el error para que sea capturado por el catch externo
        } finally {
            connection.release(); // Liberar la conexión
        }

    } catch (err) {
        console.error('Error al eliminar local y/o usuario:', err.message);
        res.status(500).json({ message: 'Error del servidor al eliminar local y/o usuario.' });
    }
});


// Iniciar el servidor (sin cambios)
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});