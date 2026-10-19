// backend/controllers/trabajadoresController.js
// Los trabajadores no tienen cuenta: son registros a los que el dueño o la encargada les atribuye servicios.
const crypto = require('crypto');
const { getDB } = require('../db');
const { filtroLocal } = require('../utils/alcance');
const { isUuid } = require('../middleware/validateUuid');
const { esGlobal } = require('../middleware/auth');

// Una fila por (trabajador, local donde trabaja o trabajó). Las cifras son SOLO de ese local, así el
// historial de cada local es independiente y no se mezcla cuando alguien rota o se traslada.
const TRABAJADOR_SELECT = `
    SELECT t.id, t.nombre, t.apellido, t.telefono,
           tl.local_id, l.nombre AS local_nombre,
           tl.estado AS asignacion_estado,
           t.local_id AS local_actual_id, la.nombre AS local_actual_nombre,
           (SELECT COUNT(*) FROM venta_items i JOIN ventas v ON v.id = i.venta_id
              WHERE i.trabajador_id = t.id AND v.local_id = tl.local_id AND v.estado = 'activa'
                AND v.fecha_hora >= DATE_FORMAT(NOW(), '%Y-%m-01')) AS servicios_mes,
           (SELECT COALESCE(SUM(i.precio), 0) FROM venta_items i JOIN ventas v ON v.id = i.venta_id
              WHERE i.trabajador_id = t.id AND v.local_id = tl.local_id AND v.estado = 'activa'
                AND v.fecha_hora >= DATE_FORMAT(NOW(), '%Y-%m-01')) AS generado_mes,
           (SELECT COALESCE(SUM(i.monto_trabajador), 0) FROM venta_items i JOIN ventas v ON v.id = i.venta_id
              WHERE i.trabajador_id = t.id AND v.local_id = tl.local_id AND v.estado = 'activa'
                AND v.fecha_hora >= DATE_FORMAT(NOW(), '%Y-%m-01')) AS comision_mes
    FROM trabajador_locales tl
    JOIN trabajadores t ON t.id = tl.trabajador_id
    JOIN locales l ON l.id = tl.local_id
    JOIN locales la ON la.id = t.local_id`;

const mapTrabajador = (r) => ({
    ...r,
    servicios_mes: Number(r.servicios_mes),
    generado_mes: parseFloat(r.generado_mes),
    comision_mes: parseFloat(r.comision_mes),
});

exports.getAllTrabajadores = async (req, res, next) => {
    try {
        const fl = filtroLocal(req.localScope, 'tl.local_id');
        const [rows] = await getDB().query(
            `${TRABAJADOR_SELECT} WHERE ${fl.sql} ORDER BY l.nombre, t.nombre, t.apellido`, fl.params);
        res.json(rows.map(mapTrabajador));
    } catch (err) {
        console.error('Error al obtener trabajadores:', err);
        next(err);
    }
};

// Alta mínima: nombre y local. (Apellido y teléfono son opcionales.)
exports.createTrabajador = async (req, res, next) => {
    try {
        const nombre = typeof req.body.nombre === 'string' ? req.body.nombre.trim() : '';
        const apellido = typeof req.body.apellido === 'string' ? req.body.apellido.trim() : '';
        const telefono = typeof req.body.telefono === 'string' ? req.body.telefono.trim() : '';
        const { local_id } = req.body;
        if (!nombre || nombre.length > 255 || apellido.length > 255 || telefono.length > 50) {
            return res.status(400).json({ message: 'El nombre del trabajador es obligatorio.' });
        }
        if (!isUuid(local_id)) return res.status(400).json({ message: 'Elige el local.' });

        const pool = getDB();
        const [l] = await pool.query('SELECT id FROM locales WHERE id = ?', [local_id]);
        if (l.length === 0) return res.status(400).json({ message: 'El local no existe.' });

        const id = crypto.randomUUID();
        await pool.query(
            `INSERT INTO trabajadores (id, nombre, apellido, telefono, fecha_ingreso, servicios, local_id)
             VALUES (?, ?, ?, ?, CURDATE(), '[]', ?)`,
            [id, nombre, apellido, telefono || null, local_id]);
        await pool.query(
            "INSERT INTO trabajador_locales (trabajador_id, local_id, estado, desde, actualizado) VALUES (?, ?, 'activo', NOW(), NOW())",
            [id, local_id]);
        const [rows] = await pool.query(`${TRABAJADOR_SELECT} WHERE t.id = ? AND tl.local_id = ?`, [id, local_id]);
        res.status(201).json(mapTrabajador(rows[0]));
    } catch (err) {
        console.error('Error al crear trabajador:', err);
        next(err);
    }
};

// Las ventas ya registradas conservan el nombre del trabajador.
exports.deleteTrabajador = async (req, res, next) => {
    try {
        const [r] = await getDB().query('DELETE FROM trabajadores WHERE id = ?', [req.params.id]);
        if (r.affectedRows === 0) return res.status(404).json({ message: 'Trabajador no encontrado para eliminar.' });
        res.json({ message: 'Trabajador eliminado. Sus ventas registradas se conservan.' });
    } catch (err) {
        console.error('Error al eliminar trabajador:', err);
        next(err);
    }
};

// Traslado: el historial del local de origen queda EN PAUSA (con sus cifras intactas) hasta que regrese;
// en el destino se abre (o se reanuda) su historial propio.
exports.transferirTrabajador = async (req, res, next) => {
    const { id } = req.params;
    const { local_destino } = req.body || {};
    const motivo = typeof req.body.motivo === 'string' ? req.body.motivo.trim().slice(0, 255) : '';
    if (!isUuid(local_destino)) return res.status(400).json({ message: 'Indica el local de destino.' });

    let conn;
    try {
        const pool = getDB();
        conn = await pool.getConnection();
        await conn.beginTransaction();

        const [ws] = await conn.query('SELECT id, nombre, apellido, local_id FROM trabajadores WHERE id = ? FOR UPDATE', [id]);
        if (ws.length === 0) { await conn.rollback(); return res.status(404).json({ message: 'Trabajador no encontrado.' }); }
        const w = ws[0];
        if (w.local_id === local_destino) { await conn.rollback(); return res.status(400).json({ message: 'El trabajador ya está en ese local.' }); }

        const [dest] = await conn.query('SELECT id FROM locales WHERE id = ?', [local_destino]);
        if (dest.length === 0) { await conn.rollback(); return res.status(400).json({ message: 'El local de destino no existe.' }); }

        await conn.query(
            "UPDATE trabajador_locales SET estado = 'pausado', actualizado = NOW() WHERE trabajador_id = ? AND local_id = ?",
            [id, w.local_id]);
        await conn.query(
            `INSERT INTO trabajador_locales (trabajador_id, local_id, estado, desde, actualizado) VALUES (?, ?, 'activo', NOW(), NOW())
             ON DUPLICATE KEY UPDATE estado = 'activo', actualizado = NOW()`,
            [id, local_destino]);
        await conn.query('UPDATE trabajadores SET local_id = ? WHERE id = ?', [local_destino, id]);
        await conn.query(
            'INSERT INTO trabajador_movimientos (id, trabajador_id, local_origen, local_destino, fecha, motivo, usuario) VALUES (?, ?, ?, ?, NOW(), ?, ?)',
            [crypto.randomUUID(), id, w.local_id, local_destino, motivo, req.user.username]);
        await conn.commit();

        const [rows] = await pool.query(`${TRABAJADOR_SELECT} WHERE t.id = ? AND tl.local_id = ?`, [id, local_destino]);
        res.json(mapTrabajador(rows[0]));
    } catch (err) {
        if (conn) await conn.rollback();
        console.error('Error al trasladar trabajador:', err);
        next(err);
    } finally {
        if (conn) conn.release();
    }
};

// Un trabajador que cubre dos locales: se agrega (o reanuda) en otro local SIN pausar el actual.
exports.agregarALocal = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { local_id } = req.body || {};
        if (!isUuid(local_id)) return res.status(400).json({ message: 'Elige el local.' });
        const pool = getDB();
        const [l] = await pool.query('SELECT id FROM locales WHERE id = ?', [local_id]);
        if (l.length === 0) return res.status(400).json({ message: 'El local no existe.' });
        await pool.query(
            `INSERT INTO trabajador_locales (trabajador_id, local_id, estado, desde, actualizado) VALUES (?, ?, 'activo', NOW(), NOW())
             ON DUPLICATE KEY UPDATE estado = 'activo', actualizado = NOW()`, [id, local_id]);
        const [rows] = await pool.query(`${TRABAJADOR_SELECT} WHERE t.id = ? AND tl.local_id = ?`, [id, local_id]);
        res.json(mapTrabajador(rows[0]));
    } catch (err) { next(err); }
};

// Pausa o reanuda al trabajador en un local concreto (sus cifras se conservan).
exports.cambiarEstadoEnLocal = async (req, res, next) => {
    try {
        const { id, local_id } = req.params;
        const { estado } = req.body || {};
        if (!['activo', 'pausado'].includes(estado)) return res.status(400).json({ message: 'Estado inválido.' });
        const pool = getDB();
        const [r] = await pool.query(
            'UPDATE trabajador_locales SET estado = ?, actualizado = NOW() WHERE trabajador_id = ? AND local_id = ?', [estado, id, local_id]);
        if (r.affectedRows === 0) return res.status(404).json({ message: 'El trabajador no está asociado a ese local.' });
        const [rows] = await pool.query(`${TRABAJADOR_SELECT} WHERE t.id = ? AND tl.local_id = ?`, [id, local_id]);
        res.json(mapTrabajador(rows[0]));
    } catch (err) { next(err); }
};

// Historial: cifras por local (cada uno independiente) y movimientos.
exports.historialTrabajador = async (req, res, next) => {
    try {
        const pool = getDB();
        const { id } = req.params;
        const [ws] = await pool.query('SELECT id, nombre, apellido FROM trabajadores WHERE id = ?', [id]);
        if (ws.length === 0) return res.status(404).json({ message: 'Trabajador no encontrado.' });

        const fl = filtroLocal(esGlobal(req.user) ? null : req.user.localesIds, 'tl.local_id');
        const [locales] = await pool.query(
            `SELECT tl.local_id, l.nombre AS local_nombre, tl.estado,
                    DATE_FORMAT(tl.desde, '%Y-%m-%d') AS desde, DATE_FORMAT(tl.actualizado, '%Y-%m-%d %H:%i') AS actualizado,
                    COUNT(i.id) AS servicios, COALESCE(SUM(i.precio), 0) AS generado, COALESCE(SUM(i.monto_trabajador), 0) AS comision,
                    DATE_FORMAT(MAX(v.fecha_hora), '%Y-%m-%d %H:%i') AS ultimo_servicio
             FROM trabajador_locales tl
             JOIN locales l ON l.id = tl.local_id
             LEFT JOIN ventas v ON v.local_id = tl.local_id AND v.estado = 'activa'
             LEFT JOIN venta_items i ON i.venta_id = v.id AND i.trabajador_id = tl.trabajador_id
             WHERE tl.trabajador_id = ? AND ${fl.sql}
             GROUP BY tl.local_id, l.nombre, tl.estado, tl.desde, tl.actualizado
             ORDER BY tl.actualizado DESC`,
            [id, ...fl.params]);
        if (locales.length === 0) return res.status(404).json({ message: 'Trabajador no encontrado.' });

        const [movimientos] = await pool.query(
            `SELECT DATE_FORMAT(m.fecha, '%Y-%m-%d %H:%i') AS fecha, lo.nombre AS origen, ld.nombre AS destino, m.motivo, m.usuario
             FROM trabajador_movimientos m
             LEFT JOIN locales lo ON lo.id = m.local_origen
             LEFT JOIN locales ld ON ld.id = m.local_destino
             WHERE m.trabajador_id = ? ORDER BY m.fecha DESC LIMIT 50`, [id]);

        res.json({
            trabajador: { id: ws[0].id, nombre: `${ws[0].nombre} ${ws[0].apellido}`.trim() },
            locales: locales.map(l => ({
                ...l, servicios: Number(l.servicios), generado: parseFloat(l.generado), comision: parseFloat(l.comision),
            })),
            movimientos,
        });
    } catch (err) { next(err); }
};
