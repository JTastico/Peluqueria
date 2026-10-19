// backend/controllers/serviciosController.js
// Servicios con precio sugerido y el porcentaje del precio que se lleva el trabajador (el resto es del local).
const crypto = require('crypto');
const { getDB } = require('../db');
const { filtroLocal } = require('../utils/alcance');
const { isUuid } = require('../middleware/validateUuid');
const { puedeVerLocal } = require('../middleware/auth');

const MAX_PRECIO = 99999999;

const serializar = (s) => ({
    ...s,
    precio: parseFloat(s.precio),
    porcentaje_trabajador: parseFloat(s.porcentaje_trabajador),
});

// Valida y limpia los datos del servicio; devuelve { error } o { nombre, precio, pct }
const validar = (body) => {
    const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
    const precio = Math.round(Number(body.precio) * 100) / 100;
    const pct = Number(body.porcentaje_trabajador);
    if (!nombre || nombre.length > 255) return { error: 'El nombre del servicio es obligatorio.' };
    if (!Number.isFinite(precio) || precio <= 0 || precio > MAX_PRECIO) {
        return { error: 'El precio debe ser un número mayor a 0 y menor a 100 millones.' };
    }
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) return { error: 'El porcentaje del trabajador debe estar entre 0 y 100.' };
    return { nombre, precio, pct: Math.round(pct * 100) / 100 };
};

exports.getAllServicios = async (req, res, next) => {
    try {
        const fl = filtroLocal(req.localScope, 's.local_id'); // locales dentro del alcance del usuario
        const [rows] = await getDB().query(`
            SELECT s.id, s.nombre, s.precio, s.porcentaje_trabajador, s.local_id, l.nombre AS local_nombre
            FROM servicios s JOIN locales l ON s.local_id = l.id
            WHERE ${fl.sql}
            ORDER BY l.nombre, s.nombre`, fl.params);
        res.json(rows.map(serializar));
    } catch (err) {
        console.error('Error al obtener servicios:', err.message);
        next(err);
    }
};

// Crea el servicio en uno o varios locales a la vez: { locales: [ids] } o { local_id }
exports.createServicio = async (req, res, next) => {
    try {
        const d = validar(req.body || {});
        if (d.error) return res.status(400).json({ message: d.error });

        const destinos = Array.isArray(req.body.locales) ? req.body.locales : [req.body.local_id];
        const unicos = [...new Set(destinos)];
        if (unicos.length === 0 || unicos.some(l => !isUuid(l))) return res.status(400).json({ message: 'Elige al menos un local.' });
        if (unicos.some(l => !puedeVerLocal(req.user, l))) return res.status(403).json({ message: 'No tienes acceso a ese local.' });

        const pool = getDB();
        const [existentes] = await pool.query('SELECT id FROM locales WHERE id IN (?)', [unicos]);
        if (existentes.length !== unicos.length) return res.status(400).json({ message: 'Algún local indicado no existe.' });

        const creados = [];
        for (const local of unicos) {
            const id = crypto.randomUUID();
            await pool.query(
                'INSERT INTO servicios (id, nombre, precio, porcentaje_trabajador, local_id) VALUES (?, ?, ?, ?, ?)',
                [id, d.nombre, d.precio, d.pct, local]);
            creados.push(id);
        }
        const [rows] = await pool.query(
            `SELECT s.id, s.nombre, s.precio, s.porcentaje_trabajador, s.local_id, l.nombre AS local_nombre
             FROM servicios s JOIN locales l ON l.id = s.local_id WHERE s.id IN (?)`, [creados]);
        res.status(201).json(rows.map(serializar));
    } catch (err) {
        console.error('Error al crear servicio:', err.message);
        next(err);
    }
};

// Cambia nombre, precio y porcentaje. Las ventas ya registradas conservan el reparto con el que se hicieron.
exports.updateServicio = async (req, res, next) => {
    try {
        const d = validar(req.body || {});
        if (d.error) return res.status(400).json({ message: d.error });
        const pool = getDB();
        const [r] = await pool.query(
            'UPDATE servicios SET nombre = ?, precio = ?, porcentaje_trabajador = ? WHERE id = ?',
            [d.nombre, d.precio, d.pct, req.params.id]);
        if (r.affectedRows === 0) return res.status(404).json({ message: 'Servicio no encontrado.' });
        const [rows] = await pool.query(
            `SELECT s.id, s.nombre, s.precio, s.porcentaje_trabajador, s.local_id, l.nombre AS local_nombre
             FROM servicios s JOIN locales l ON l.id = s.local_id WHERE s.id = ?`, [req.params.id]);
        res.json(serializar(rows[0]));
    } catch (err) {
        console.error('Error al actualizar servicio:', err.message);
        next(err);
    }
};

exports.deleteServicio = async (req, res, next) => {
    try {
        const [r] = await getDB().query('DELETE FROM servicios WHERE id = ?', [req.params.id]);
        if (r.affectedRows === 0) return res.status(404).json({ message: 'Servicio no encontrado para eliminar.' });
        res.json({ message: 'Servicio eliminado. Las ventas ya registradas se conservan.' });
    } catch (err) {
        console.error('Error al eliminar servicio:', err.message);
        next(err);
    }
};
