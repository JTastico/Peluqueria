// backend/server.js

const express = require('express');
const mysql = require('mysql2/promise'); // Importa mysql2 con soporte de promesas
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Configuración de la conexión a la base de datos MySQL
const dbConfig = {
    host: process.env.DB_HOST || 'localhost', // O la IP/host de tu servidor MySQL
    user: process.env.DB_USER || 'root',      // Tu usuario de MySQL
    password: process.env.DB_PASSWORD || '', // Tu contraseña de MySQL
    database: process.env.DB_NAME || 'peluqueria', // El nombre de tu base de datos
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let pool; // Usaremos un pool de conexiones para mejor gestión

async function initializeDatabase() {
    try {
        pool = mysql.createPool(dbConfig); // Crea un pool de conexiones
        console.log('Pool de conexiones MySQL creado.');

        // Prueba la conexión
        const connection = await pool.getConnection();
        console.log('Conectado a la base de datos MySQL.');
        connection.release(); // Libera la conexión de vuelta al pool

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

        // Insertar usuarios por defecto si la tabla está vacía
        const [rows] = await pool.query("SELECT COUNT(*) as count FROM users");
        if (rows[0].count === 0) {
            await pool.query("INSERT INTO users (username, password, role, local_id) VALUES (?, ?, ?, ?)", ["admin", "admin", "admin", null]);
            await pool.query("INSERT INTO users (username, password, role, local_id) VALUES (?, ?, ?, ?)", ["barberia", "barberia", "encargado", 1]);
            await pool.query("INSERT INTO users (username, password, role, local_id) VALUES (?, ?, ?, ?)", ["peluqueria", "peluqueria", "encargado", 2]);
            await pool.query("INSERT INTO users (username, password, role, local_id) VALUES (?, ?, ?, ?)", ["spa", "spa", "encargado", 3]);
            console.log('Usuarios por defecto insertados en MySQL.');
        }

    } catch (err) {
        console.error('Error al inicializar la base de datos MySQL:', err.message);
        // Salir de la aplicación si no se puede conectar a la base de datos
        process.exit(1);
    }
}

// Llama a la función de inicialización de la base de datos al inicio
initializeDatabase();


// Rutas de la API

// Ruta de login
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

// Ruta para obtener todos los usuarios (solo para admin)
app.get('/api/users', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, username, role, local_id FROM users');
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener usuarios:', err.message);
        res.status(500).json({ message: 'Error del servidor.' });
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});