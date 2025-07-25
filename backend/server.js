// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./db'); // CORRECCIÓN: Cambiado de initializeDatabase a connectDB
const errorHandler = require('./middleware/errorHandler');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const localesRoutes = require('./routes/localesRoutes');
const trabajadoresRoutes = require('./routes/trabajadoresRoutes');
const serviciosRoutes = require('./routes/serviciosRoutes');
const clientesRoutes = require('./routes/clientesRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Montar rutas
app.use('/api/auth', authRoutes);
app.use('/api/locales', localesRoutes);
app.use('/api/trabajadores', trabajadoresRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/clientes', clientesRoutes);

// Middleware de manejo de errores (siempre al final, después de todas las rutas)
app.use(errorHandler);

// Iniciar la base de datos y luego el servidor
connectDB().then(() => { // CORRECCIÓN: Cambiado de initializeDatabase() a connectDB()
    app.listen(PORT, () => {
        console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Fallo al iniciar el servidor debido a un error de base de datos:', err);
    process.exit(1);
});