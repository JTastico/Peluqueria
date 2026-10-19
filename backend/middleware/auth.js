// backend/middleware/auth.js
// Autenticación (JWT) y autorización por permisos y por alcance de locales.
const jwt = require('jsonwebtoken');
const { getDB } = require('../db');
const { cargarUsuario } = require('../utils/usuarios');

const ALGORITHM = 'HS256';

const getSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error('JWT_SECRET no está definido o tiene menos de 32 caracteres.');
    }
    return secret;
};

const signToken = (user) =>
    jwt.sign(
        { role: user.role },
        getSecret(),
        { algorithm: ALGORITHM, subject: user.id, expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
    );

const fail = (res, status, message, extra = {}) => res.status(status).json({ message, ...extra });

const tienePermiso = (user, permiso) => user.permisos.includes(permiso);
const esGlobal = (user) => user.alcance === 'global';
const puedeVerLocal = (user, localId) => esGlobal(user) || user.localesIds.includes(localId);

// Exige "Authorization: Bearer <token>". El usuario, su rol y sus permisos se leen de la base
// en cada petición: un cambio de rol o un usuario borrado surten efecto al instante.
const authenticate = async (req, res, next) => {
    try {
        const header = req.headers.authorization || '';
        const [scheme, token] = header.split(' ');
        if (scheme !== 'Bearer' || !token) return fail(res, 401, 'Sesión no iniciada.');

        let payload;
        try {
            payload = jwt.verify(token, getSecret(), { algorithms: [ALGORITHM] });
        } catch (err) {
            return fail(res, 401, err.name === 'TokenExpiredError' ? 'La sesión expiró.' : 'Sesión inválida.');
        }

        const pool = getDB();
        const user = await cargarUsuario(pool, payload.sub);
        if (!user) return fail(res, 401, 'El usuario ya no existe.');

        req.user = user;
        next();
    } catch (err) {
        next(err);
    }
};

// Pasa si el usuario tiene al menos uno de los permisos indicados.
const requirePermiso = (...permisos) => (req, res, next) => {
    if (!req.user || !permisos.some(p => tienePermiso(req.user, p))) {
        return fail(res, 403, 'No tienes permiso para esta acción.');
    }
    next();
};

// Fija req.localScope (null = todos los locales, o lista de ids). Si se pide un local con ?local_id
// debe estar dentro del alcance del usuario.
const resolveLocalScope = (req, res, next) => {
    const requested = req.query.local_id || null;
    if (esGlobal(req.user)) {
        req.localScope = requested ? [requested] : null;
        return next();
    }
    if (requested && !req.user.localesIds.includes(requested)) {
        return fail(res, 403, 'No tienes acceso a ese local.');
    }
    req.localScope = requested ? [requested] : req.user.localesIds;
    next();
};

// Para POST/PUT con local_id en el cuerpo: debe estar dentro del alcance del usuario.
// Si falta y el usuario solo llega a un local, se usa ese.
const enforceBodyLocal = (req, res, next) => {
    if (esGlobal(req.user)) return next();
    const body = req.body || {};
    const sent = body.local_id;
    if (sent) {
        if (!req.user.localesIds.includes(sent)) return fail(res, 403, 'No tienes acceso a ese local.');
        return next();
    }
    if (req.user.localesIds.length === 1) {
        req.body = { ...body, local_id: req.user.localesIds[0] };
        return next();
    }
    return fail(res, 400, 'Indica el local.');
};

// Para rutas /:id de un registro con local_id: solo los de locales dentro del alcance.
// (Nombres de tabla fijos: nunca se interpolan valores del cliente.)
const OWNED_TABLES = ['servicios', 'trabajadores', 'productos', 'ventas'];
const ownsRecord = (table) => {
    if (!OWNED_TABLES.includes(table)) throw new Error(`Tabla no permitida: ${table}`);
    return async (req, res, next) => {
        try {
            if (esGlobal(req.user)) return next();
            const [rows] = await getDB().query(`SELECT local_id FROM ${table} WHERE id = ?`, [req.params.id]);
            if (rows.length === 0 || !req.user.localesIds.includes(rows[0].local_id)) {
                return fail(res, 404, 'Registro no encontrado.');
            }
            next();
        } catch (err) {
            next(err);
        }
    };
};

// Para /locales/:id y similares.
const ownsLocalParam = (req, res, next) => {
    if (puedeVerLocal(req.user, req.params.id)) return next();
    return fail(res, 403, 'No tienes acceso a ese local.');
};

module.exports = {
    getSecret, signToken, authenticate, requirePermiso, tienePermiso, esGlobal, puedeVerLocal,
    resolveLocalScope, enforceBodyLocal, ownsRecord, ownsLocalParam,
};
