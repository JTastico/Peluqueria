// backend/controllers/marcaController.js
// Apariencia del sistema: paleta de colores y logo (solo los cambia el administrador).
const crypto = require('crypto');
const { getDB } = require('../db');

const HEX = /^#[0-9a-fA-F]{6}$/;
const MAX_LOGO = 512 * 1024; // 512 KB
const MIMES = ['image/png', 'image/jpeg', 'image/webp'];

const luminancia = (hex) => {
    const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.substr(i, 2), 16) / 255)
        .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
// Contraste contra blanco (los botones llevan texto blanco sobre el color primario)
const contrasteConBlanco = (hex) => 1.05 / (luminancia(hex) + 0.05);

const leerConfig = async (claves) => {
    const [rows] = await getDB().query('SELECT clave, valor FROM configuracion WHERE clave IN (?)', [claves]);
    return Object.fromEntries(rows.map(r => [r.clave, r.valor]));
};

const guardar = (clave, valor) => getDB().query(
    'INSERT INTO configuracion (clave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = VALUES(valor)', [clave, valor]);

// Público: la pantalla de login también usa el tema y el logo.
exports.getMarca = async (req, res, next) => {
    try {
        const c = await leerConfig(['nombre_negocio', 'tema_primario', 'tema_secundario', 'tema_preset', 'logo_mime', 'logo_version']);
        res.json({
            nombre_negocio: c.nombre_negocio || 'Koko',
            tema: { primario: c.tema_primario || '#7e47eb', secundario: c.tema_secundario || '#f59e0b', preset: c.tema_preset || 'lavanda' },
            logo: c.logo_mime ? { version: c.logo_version } : null,
        });
    } catch (err) { next(err); }
};

exports.getLogo = async (req, res, next) => {
    try {
        const c = await leerConfig(['logo_mime', 'logo_datos', 'logo_version']);
        if (!c.logo_mime || !c.logo_datos) return res.status(404).json({ message: 'Sin logo.' });
        res.set({
            'Content-Type': c.logo_mime,
            'Cache-Control': 'public, max-age=300',
            'X-Content-Type-Options': 'nosniff',
            ETag: `"${c.logo_version}"`,
        });
        res.send(Buffer.from(c.logo_datos, 'base64'));
    } catch (err) { next(err); }
};

exports.guardarTema = async (req, res, next) => {
    try {
        const { primario, secundario, preset } = req.body || {};
        if (!HEX.test(primario || '') || !HEX.test(secundario || '')) {
            return res.status(400).json({ message: 'Los colores deben tener formato #RRGGBB.' });
        }
        if (contrasteConBlanco(primario) < 4.5) {
            return res.status(400).json({ message: 'El color primario es demasiado claro: el texto blanco de los botones no se leería bien. Elige uno más oscuro.' });
        }
        if (contrasteConBlanco(secundario) < 1.8) {
            return res.status(400).json({ message: 'El color secundario es demasiado claro. Elige uno con más contraste.' });
        }
        const presetLimpio = typeof preset === 'string' && /^[a-z0-9_]{1,20}$/.test(preset) ? preset : 'personalizado';
        await guardar('tema_primario', primario.toLowerCase());
        await guardar('tema_secundario', secundario.toLowerCase());
        await guardar('tema_preset', presetLimpio);
        res.json({ tema: { primario: primario.toLowerCase(), secundario: secundario.toLowerCase(), preset: presetLimpio } });
    } catch (err) { next(err); }
};

// Valida el tipo real de la imagen por sus primeros bytes (no solo por lo que declara el cliente)
const tipoReal = (b) => {
    if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
    if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
    if (b.length > 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
    return null;
};

exports.guardarLogo = async (req, res, next) => {
    try {
        const { mime, datos } = req.body || {};
        if (!MIMES.includes(mime) || typeof datos !== 'string' || !/^[A-Za-z0-9+/=]+$/.test(datos)) {
            return res.status(400).json({ message: 'El logo debe ser una imagen PNG, JPG o WebP.' });
        }
        const buf = Buffer.from(datos, 'base64');
        if (buf.length === 0 || buf.length > MAX_LOGO) {
            return res.status(400).json({ message: 'El logo pesa demasiado (máximo 512 KB).' });
        }
        if (tipoReal(buf) !== mime) {
            return res.status(400).json({ message: 'El archivo no es una imagen válida.' });
        }
        const version = crypto.randomBytes(6).toString('hex');
        await guardar('logo_mime', mime);
        await guardar('logo_datos', datos);
        await guardar('logo_version', version);
        res.json({ logo: { version } });
    } catch (err) { next(err); }
};

exports.eliminarLogo = async (req, res, next) => {
    try {
        await guardar('logo_mime', '');
        await guardar('logo_datos', '');
        await guardar('logo_version', '0');
        res.json({ logo: null });
    } catch (err) { next(err); }
};
