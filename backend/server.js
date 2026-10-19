// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./db'); // CORRECCIÓN: Cambiado de initializeDatabase a connectDB
const errorHandler = require('./middleware/errorHandler');
const { validateIdFields } = require('./middleware/validateUuid');
const { authenticate, getSecret } = require('./middleware/auth');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const localesRoutes = require('./routes/localesRoutes');
const trabajadoresRoutes = require('./routes/trabajadoresRoutes');
const serviciosRoutes = require('./routes/serviciosRoutes');
const reportesRoutes = require('./routes/reportesRoutes');
const ventasRoutes = require('./routes/ventasRoutes');
const productosRoutes = require('./routes/productosRoutes');
const configuracionRoutes = require('./routes/configuracionRoutes');
const marcaRoutes = require('./routes/marcaRoutes');
const rolesRoutes = require('./routes/rolesRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');

// Sin secreto JWT válido no se arranca (evita tokens firmables por terceros)
getSecret();

const app = express();
app.disable('x-powered-by');
// Detrás de un proxy inverso, TRUST_PROXY=1 para que req.ip sea la IP real del cliente
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);
const PORT = process.env.PORT || 3001;

// Cabeceras de seguridad básicas
app.use((req, res, next) => {
    res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'no-referrer',
        'Cross-Origin-Resource-Policy': 'same-site',
        'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
    });
    if (req.secure) res.set('Strict-Transport-Security', 'max-age=15552000');
    next();
});

// Límite general de peticiones por IP (en memoria): frena abuso y fuerza bruta distribuida en rutas
const LIM_VENTANA_MS = 60 * 1000;
const LIM_MAX = Number(process.env.RATE_LIMIT_MAX) || 300;
const contadores = new Map();
setInterval(() => {
    const ahora = Date.now();
    for (const [ip, c] of contadores) if (ahora - c.inicio > LIM_VENTANA_MS) contadores.delete(ip);
}, LIM_VENTANA_MS).unref();
app.use('/api', (req, res, next) => {
    const ahora = Date.now();
    let c = contadores.get(req.ip);
    if (!c || ahora - c.inicio > LIM_VENTANA_MS) { c = { inicio: ahora, n: 0 }; contadores.set(req.ip, c); }
    if (++c.n > LIM_MAX) return res.status(429).json({ message: 'Demasiadas peticiones. Inténtalo en un minuto.' });
    next();
});

// Middlewares
const origenes = (process.env.FRONTEND_ORIGIN || 'http://localhost:8080').split(',').map(o => o.trim());
app.use(cors({ origin: origenes }));
// El logo viaja en base64 (hasta 512 KB): ruta con límite propio, antes del parser general
app.use('/api/configuracion/logo', express.json({ limit: '1mb' }));
app.use(express.json({ limit: '100kb' }));
app.use('/api', validateIdFields);

// Montar rutas
app.use('/api/auth', authRoutes);
app.use('/api/marca', marcaRoutes); // público: tema y logo
app.use('/api/locales', authenticate, localesRoutes);
app.use('/api/trabajadores', authenticate, trabajadoresRoutes);
app.use('/api/servicios', authenticate, serviciosRoutes);
app.use('/api/reportes', authenticate, reportesRoutes);
app.use('/api/ventas', authenticate, ventasRoutes);
app.use('/api/productos', authenticate, productosRoutes);
app.use('/api/configuracion', authenticate, configuracionRoutes);
app.use('/api/roles', authenticate, rolesRoutes);
app.use('/api/usuarios', authenticate, usuariosRoutes);

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