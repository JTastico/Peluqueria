// backend/controllers/configuracionController.js
const { getDB } = require('../db');

const CLAVES = ['nombre_negocio', 'email', 'telefono', 'direccion'];

exports.getConfiguracion = async (req, res, next) => {
    try {
        const [rows] = await getDB().query('SELECT clave, valor FROM configuracion');
        const config = Object.fromEntries(CLAVES.map(c => [c, '']));
        for (const r of rows) if (CLAVES.includes(r.clave)) config[r.clave] = r.valor;
        res.json(config);
    } catch (err) { next(err); }
};

exports.updateConfiguracion = async (req, res, next) => {
    try {
        const pool = getDB();
        for (const clave of CLAVES) {
            if (req.body[clave] === undefined) continue;
            const valor = String(req.body[clave]).trim();
            if (valor.length > 255) return res.status(400).json({ message: `'${clave}' es demasiado largo.` });
            await pool.query(
                'INSERT INTO configuracion (clave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = VALUES(valor)',
                [clave, valor]
            );
        }
        return exports.getConfiguracion(req, res, next);
    } catch (err) { next(err); }
};
