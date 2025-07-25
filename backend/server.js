// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initializeDatabase } = require('./db');
const errorHandler = require('./middleware/errorHandler');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const localesRoutes = require('./routes/localesRoutes');
const trabajadoresRoutes = require('./routes/trabajadoresRoutes');
const serviciosRoutes = require('./routes/serviciosRoutes'); // NUEVO: Importar rutas de servicios

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Montar rutas
app.use('/api/auth', authRoutes);
app.use('/api/locales', localesRoutes);
app.use('/api/trabajadores', trabajadoresRoutes);
app.use('/api/servicios', serviciosRoutes); // NUEVO: Montar rutas de servicios

// Middleware de manejo de errores
app.use(errorHandler);

// Iniciar la base de datos y luego el servidor
initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Fallo al iniciar el servidor debido a un error de base de datos:', err);
    process.exit(1);
});