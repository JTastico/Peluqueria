// backend/controllers/ventasController.js
// Una venta es lo que el cliente paga al entregar su ticket: uno o varios servicios, cada uno con su
// precio (ajustable), el trabajador que lo hizo y el reparto trabajador/local vigente en ese momento.
const crypto = require('crypto');
const { getDB } = require('../db');
const { isUuid } = require('../middleware/validateUuid');
const { filtroLocal } = require('../utils/alcance');

const METODOS = ['efectivo', 'yape', 'plin', 'tarjeta', 'transferencia'];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MAX_ITEMS = 30;
const MAX_PRECIO = 99999999;

const round2 = (n) => Math.round(n * 100) / 100;
const hoy = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const FMT = "'%Y-%m-%d %H:%i:%s'";
const SELECT_VENTA = `
    SELECT v.id, v.local_id, l.nombre AS local_nombre, DATE_FORMAT(v.fecha_hora, ${FMT}) AS fecha_hora,
           v.total, v.metodo_pago, v.estado, v.registrado_por
    FROM ventas v JOIN locales l ON l.id = v.local_id`;

// Adjunta los servicios de cada venta
const conItems = async (pool, ventas) => {
    if (ventas.length === 0) return [];
    const [items] = await pool.query(
        `SELECT id, venta_id, servicio_id, servicio_nombre, trabajador_id, trabajador_nombre, precio,
                porcentaje_trabajador, monto_trabajador, monto_local
         FROM venta_items WHERE venta_id IN (?) ORDER BY id`,
        [ventas.map(v => v.id)]
    );
    return ventas.map(v => ({
        ...v,
        total: parseFloat(v.total),
        items: items.filter(i => i.venta_id === v.id).map(i => ({
            ...i,
            precio: parseFloat(i.precio),
            porcentaje_trabajador: parseFloat(i.porcentaje_trabajador),
            monto_trabajador: parseFloat(i.monto_trabajador),
            monto_local: parseFloat(i.monto_local),
        })),
    }));
};

exports.crearVenta = async (req, res, next) => {
    let conn;
    try {
        const { local_id, items, fecha } = req.body || {};
        const metodo = req.body.metodo_pago || 'efectivo';

        if (!isUuid(local_id)) return res.status(400).json({ message: 'Elige el local.' });
        if (!METODOS.includes(metodo)) return res.status(400).json({ message: 'Método de pago inválido.' });
        if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'Agrega al menos un servicio.' });
        if (items.length > MAX_ITEMS) return res.status(400).json({ message: `Máximo ${MAX_ITEMS} servicios por venta.` });
        if (fecha !== undefined && fecha !== null && fecha !== '') {
            if (!DATE_REGEX.test(fecha)) return res.status(400).json({ message: 'Fecha inválida.' });
            if (fecha > hoy()) return res.status(400).json({ message: 'La fecha no puede ser futura.' });
        }

        const pool = getDB();
        for (const it of items) {
            if (!it || !isUuid(it.servicio_id)) return res.status(400).json({ message: 'Servicio inválido.' });
            if (!isUuid(it.trabajador_id)) return res.status(400).json({ message: 'Elige quién hizo cada servicio.' });
            const precio = round2(Number(it.precio));
            if (!Number.isFinite(precio) || precio <= 0 || precio > MAX_PRECIO) {
                return res.status(400).json({ message: 'El precio de cada servicio debe ser mayor a 0.' });
            }
            it.precioValidado = precio;
        }

        // Una consulta para todos los servicios y otra para todos los trabajadores (en vez de 2 por ítem)
        const servicioIds = [...new Set(items.map(i => i.servicio_id))];
        const trabajadorIds = [...new Set(items.map(i => i.trabajador_id))];
        const [[svRows], [trRows]] = await Promise.all([
            pool.query('SELECT id, nombre, local_id, porcentaje_trabajador FROM servicios WHERE id IN (?)', [servicioIds]),
            pool.query(
                `SELECT t.id, CONCAT(t.nombre, ' ', t.apellido) AS nombre FROM trabajadores t
                 JOIN trabajador_locales tl ON tl.trabajador_id = t.id
                 WHERE t.id IN (?) AND tl.local_id = ? AND tl.estado = 'activo'`, [trabajadorIds, local_id]),
        ]);
        const servicios = new Map(svRows.map(r => [r.id, r]));
        const trabajadores = new Map(trRows.map(r => [r.id, r]));

        const preparados = [];
        for (const it of items) {
            const sv = servicios.get(it.servicio_id);
            if (!sv || sv.local_id !== local_id) {
                return res.status(400).json({ message: 'Un servicio no pertenece a este local.' });
            }
            const tr = trabajadores.get(it.trabajador_id);
            if (!tr) return res.status(400).json({ message: 'Un trabajador no está activo en este local.' });

            const precio = it.precioValidado;
            const pct = parseFloat(sv.porcentaje_trabajador);
            const parteTrabajador = Math.round(precio * pct) / 100;
            preparados.push({
                servicio_id: it.servicio_id, servicio_nombre: sv.nombre,
                trabajador_id: it.trabajador_id, trabajador_nombre: tr.nombre.trim(),
                precio, pct, parteTrabajador, parteLocal: round2(precio - parteTrabajador),
            });
        }
        const total = round2(preparados.reduce((a, p) => a + p.precio, 0));

        const ventaId = crypto.randomUUID();
        conn = await pool.getConnection();
        await conn.beginTransaction();
        // Hoy: la hora actual. Otro día pasado: ese día, a la hora en que se anota.
        const esHoy = !fecha || fecha === hoy();
        await conn.query(
            `INSERT INTO ventas (id, local_id, fecha_hora, total, metodo_pago, estado, registrado_por, creado)
             VALUES (?, ?, ${esHoy ? 'NOW()' : "TIMESTAMP(?, CURTIME())"}, ?, ?, 'activa', ?, NOW())`,
            esHoy ? [ventaId, local_id, total, metodo, req.user.username]
                  : [ventaId, local_id, fecha, total, metodo, req.user.username]
        );
        await conn.query(
            `INSERT INTO venta_items (id, venta_id, servicio_id, servicio_nombre, trabajador_id, trabajador_nombre,
                                      precio, porcentaje_trabajador, monto_trabajador, monto_local)
             VALUES ?`,
            [preparados.map(p => [crypto.randomUUID(), ventaId, p.servicio_id, p.servicio_nombre, p.trabajador_id,
                                  p.trabajador_nombre, p.precio, p.pct, p.parteTrabajador, p.parteLocal])]
        );
        await conn.commit();

        const [rows] = await pool.query(`${SELECT_VENTA} WHERE v.id = ?`, [ventaId]);
        res.status(201).json((await conItems(pool, rows))[0]);
    } catch (err) {
        if (conn) await conn.rollback();
        console.error('Error al registrar venta:', err);
        next(err);
    } finally {
        if (conn) conn.release();
    }
};

// Filtros: fecha (un día) o desde/hasta; local_id (dentro del alcance del usuario)
exports.listarVentas = async (req, res, next) => {
    try {
        const { fecha, desde, hasta } = req.query;
        const fl = filtroLocal(req.localScope, 'v.local_id');
        const where = [fl.sql];
        const params = [...fl.params];
        for (const f of [fecha, desde, hasta]) {
            if (f && !DATE_REGEX.test(f)) return res.status(400).json({ message: 'Fecha inválida.' });
        }
        // Rangos sobre fecha_hora (sin DATE()) para aprovechar los índices
        if (fecha) { where.push('v.fecha_hora >= ? AND v.fecha_hora < ? + INTERVAL 1 DAY'); params.push(`${fecha} 00:00:00`, `${fecha} 00:00:00`); }
        if (desde) { where.push('v.fecha_hora >= ?'); params.push(`${desde} 00:00:00`); }
        if (hasta) { where.push('v.fecha_hora < ? + INTERVAL 1 DAY'); params.push(`${hasta} 00:00:00`); }

        const pool = getDB();
        const [rows] = await pool.query(`${SELECT_VENTA} WHERE ${where.join(' AND ')} ORDER BY v.fecha_hora DESC LIMIT 300`, params);
        res.json(await conItems(pool, rows));
    } catch (err) { next(err); }
};

exports.anularVenta = async (req, res, next) => {
    try {
        const pool = getDB();
        const [r] = await pool.query("UPDATE ventas SET estado = 'anulada' WHERE id = ? AND estado = 'activa'", [req.params.id]);
        if (r.affectedRows === 0) {
            const [ex] = await pool.query('SELECT estado FROM ventas WHERE id = ?', [req.params.id]);
            if (ex.length === 0) return res.status(404).json({ message: 'Venta no encontrada.' });
            return res.status(409).json({ message: 'La venta ya estaba anulada.' });
        }
        const [rows] = await pool.query(`${SELECT_VENTA} WHERE v.id = ?`, [req.params.id]);
        res.json((await conItems(pool, rows))[0]);
    } catch (err) { next(err); }
};
