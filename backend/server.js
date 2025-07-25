// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Cargar variables de entorno al inicio

const { initializeDatabase } = require('./db'); // Importar la función de inicialización de DB
const errorHandler = require('./middleware/errorHandler'); // Importar el middleware de errores

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const localesRoutes = require('./routes/localesRoutes');
const trabajadoresRoutes = require('./routes/trabajadoresRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Montar rutas
app.use('/api/auth', authRoutes); // Prefijo para rutas de autenticación
app.use('/api/locales', localesRoutes); // Prefijo para rutas de locales
app.use('/api/trabajadores', trabajadoresRoutes); // Prefijo para rutas de trabajadores

// Middleware de manejo de errores (siempre al final, después de todas las rutas)
app.use(errorHandler);

// Iniciar la base de datos y luego el servidor
initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Fallo al iniciar el servidor debido a un error de base de datos:', err);
    process.exit(1); // Salir si la DB no se inicializa
});