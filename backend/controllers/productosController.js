// backend/controllers/productosController.js  (inventario por local)
const crypto = require('crypto');
const { getDB } = require('../db');
const { isUuid } = require('../middleware/validateUuid');
const { filtroLocal } = require('../utils/alcance');

// Agotado: sin stock · Crítico: la mitad del mínimo o menos · Bajo: bajo el mínimo
const estadoDe = (stock, minimo) => {
    if (stock <= 0) return 'Agotado';
    if (stock <= minimo / 2) return 'Crítico';
    if (stock < minimo) return 'Bajo';
    return 'Disponible';
};

const serialize = (r) => ({
    id: r.id,
    local_id: r.local_id,
    nombre: r.nombre,
    stock: r.stock,
    stock_minimo: r.stock_minimo,
    precio: parseFloat(r.precio),
    estado: estadoDe(r.stock, r.stock_minimo),
});

// Devuelve { error } o { nombre, stock, stock_minimo, precio }
const parseProducto = (body) => {
    const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
    const stock = Number(body.stock);
    const minimo = Number(body.stock_minimo);
    const precio = Number(body.precio);
    if (!nombre || nombre.length > 255) return { error: 'El nombre del producto es obligatorio.' };
    if (!Number.isInteger(stock) || stock < 0) return { error: 'El stock debe ser un entero mayor o igual a 0.' };
    if (!Number.isInteger(minimo) || minimo < 0) return { error: 'El stock mínimo debe ser un entero mayor o igual a 0.' };
    if (!Number.isFinite(precio) || precio < 0) return { error: 'El precio no es válido.' };
    return { nombre, stock, stock_minimo: minimo, precio };
};

exports.getProductos = async (req, res, next) => {
    try {
        const fl = filtroLocal(req.localScope, 'local_id'); // locales dentro del alcance del usuario
        const [rows] = await getDB().query(`SELECT * FROM productos WHERE ${fl.sql} ORDER BY nombre`, fl.params);
        res.json(rows.map(serialize));
    } catch (err) { next(err); }
};

exports.createProducto = async (req, res, next) => {
    try {
        if (!isUuid(req.body.local_id)) return res.status(400).json({ message: 'El local es obligatorio.' });
        const p = parseProducto(req.body);
        if (p.error) return res.status(400).json({ message: p.error });
        const pool = getDB();
        const [locs] = await pool.query('SELECT id FROM locales WHERE id = ?', [req.body.local_id]);
        if (locs.length === 0) return res.status(400).json({ message: 'El local no existe.' });
        const id = crypto.randomUUID();
        await pool.query(
            'INSERT INTO productos (id, local_id, nombre, stock, stock_minimo, precio) VALUES (?, ?, ?, ?, ?, ?)',
            [id, req.body.local_id, p.nombre, p.stock, p.stock_minimo, p.precio]
        );
        const [rows] = await pool.query('SELECT * FROM productos WHERE id = ?', [id]);
        res.status(201).json(serialize(rows[0]));
    } catch (err) { next(err); }
};

exports.updateProducto = async (req, res, next) => {
    try {
        const p = parseProducto(req.body);
        if (p.error) return res.status(400).json({ message: p.error });
        const pool = getDB();
        const [result] = await pool.query(
            'UPDATE productos SET nombre = ?, stock = ?, stock_minimo = ?, precio = ? WHERE id = ?',
            [p.nombre, p.stock, p.stock_minimo, p.precio, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Producto no encontrado.' });
        const [rows] = await pool.query('SELECT * FROM productos WHERE id = ?', [req.params.id]);
        res.json(serialize(rows[0]));
    } catch (err) { next(err); }
};

// Ajuste rápido de stock: { delta: +5 | -1 }
exports.ajustarStock = async (req, res, next) => {
    try {
        const delta = Number(req.body.delta);
        if (!Number.isInteger(delta) || delta === 0 || Math.abs(delta) > 100000) {
            return res.status(400).json({ message: 'Ajuste de stock inválido.' });
        }
        const pool = getDB();
        const [result] = await pool.query(
            'UPDATE productos SET stock = stock + ? WHERE id = ? AND stock + ? >= 0',
            [delta, req.params.id, delta]
        );
        if (result.affectedRows === 0) {
            const [exists] = await pool.query('SELECT id FROM productos WHERE id = ?', [req.params.id]);
            if (exists.length === 0) return res.status(404).json({ message: 'Producto no encontrado.' });
            return res.status(409).json({ message: 'El stock no puede quedar negativo.' });
        }
        const [rows] = await pool.query('SELECT * FROM productos WHERE id = ?', [req.params.id]);
        res.json(serialize(rows[0]));
    } catch (err) { next(err); }
};

exports.deleteProducto = async (req, res, next) => {
    try {
        const [result] = await getDB().query('DELETE FROM productos WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Producto no encontrado.' });
        res.json({ message: 'Producto eliminado.' });
    } catch (err) { next(err); }
};
