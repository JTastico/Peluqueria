// backend/controllers/authController.js
const bcrypt = require('bcrypt');
const { getDB } = require('../db');
const { signToken } = require('../middleware/auth');
const { cargarUsuario, FUENTES, TAMANOS } = require('../utils/usuarios');

// Límite de intentos fallidos por IP + usuario (en memoria).
const MAX_FALLOS = 8;
const VENTANA_MS = 15 * 60 * 1000;
const fallos = new Map();

// Evita que el mapa crezca sin límite con intentos de usuarios inexistentes
setInterval(() => {
    const ahora = Date.now();
    for (const [k, lista] of fallos) if (!lista.some(t => ahora - t < VENTANA_MS)) fallos.delete(k);
}, VENTANA_MS).unref();

const claveIntento = (req, username) => `${req.ip}|${String(username).toLowerCase()}`;
const intentosRecientes = (clave) => {
    const ahora = Date.now();
    const lista = (fallos.get(clave) || []).filter(t => ahora - t < VENTANA_MS);
    fallos.set(clave, lista);
    return lista;
};

// Hash ficticio para que el tiempo de respuesta no revele si el usuario existe.
const HASH_FALSO = bcrypt.hashSync('contraseña-inexistente', 10);

// Lo que el frontend necesita para dibujar la interfaz (el backend sigue validando cada petición)
const userPublico = (u) => ({
    id: u.id,
    username: u.username,
    role: u.role,
    rol_nombre: u.rol_nombre,
    alcance: u.alcance,
    local_id: u.local_id,
    trabajador_id: u.trabajador_id,
    permisos: u.permisos,
    locales: u.locales.map(l => ({ id: l.id, nombre: l.nombre, type: l.type })),
    preferencias: u.preferencias,
});

exports.login = async (req, res, next) => {
    const { username, password } = req.body || {};

    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
        return res.status(400).json({ message: 'Nombre de usuario y contraseña son requeridos.' });
    }

    if (username.length > 255 || password.length > 72) {
        return res.status(400).json({ message: 'Credenciales inválidas.' });
    }

    const clave = claveIntento(req, username);
    if (intentosRecientes(clave).length >= MAX_FALLOS) {
        return res.status(429).json({ message: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' });
    }

    try {
        const [rows] = await getDB().query('SELECT * FROM users WHERE username = ?', [username]);
        const user = rows[0];
        const valido = await bcrypt.compare(password, user ? user.password : HASH_FALSO);

        if (!user || !valido) {
            intentosRecientes(clave).push(Date.now());
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        const completo = await cargarUsuario(getDB(), user.id);
        fallos.delete(clave);
        res.json({ message: 'Login exitoso', token: signToken(user), user: userPublico(completo) });
    } catch (err) {
        console.error('Error en el login:', err);
        next(err);
    }
};

exports.me = (req, res) => {
    res.json({ user: userPublico(req.user) });
};

// Cada usuario elige su propio tipo y tamaño de letra.
exports.guardarPreferencias = async (req, res, next) => {
    const { fuente, tamano } = req.body || {};
    if (!FUENTES.includes(fuente) || !TAMANOS.includes(tamano)) {
        return res.status(400).json({ message: 'Preferencias inválidas.' });
    }
    try {
        await getDB().query('UPDATE users SET pref_fuente = ?, pref_tamano = ? WHERE id = ?', [fuente, tamano, req.user.id]);
        res.json({ preferencias: { fuente, tamano } });
    } catch (err) {
        next(err);
    }
};

exports.cambiarPassword = async (req, res, next) => {
    const { actual, nueva } = req.body || {};
    if (typeof actual !== 'string' || typeof nueva !== 'string') {
        return res.status(400).json({ message: 'Contraseña actual y nueva son obligatorias.' });
    }
    if (nueva.length < 8 || nueva.length > 72) {
        return res.status(400).json({ message: 'La nueva contraseña debe tener entre 8 y 72 caracteres.' });
    }
    if (nueva === actual || nueva === req.user.username) {
        return res.status(400).json({ message: 'La nueva contraseña debe ser distinta a la actual y al usuario.' });
    }
    try {
        const pool = getDB();
        const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
        if (rows.length === 0 || !(await bcrypt.compare(actual, rows[0].password))) {
            return res.status(401).json({ message: 'La contraseña actual no es correcta.' });
        }
        await pool.query('UPDATE users SET password = ? WHERE id = ?', [await bcrypt.hash(nueva, 10), req.user.id]);
        res.json({ message: 'Contraseña actualizada.' });
    } catch (err) {
        next(err);
    }
};
