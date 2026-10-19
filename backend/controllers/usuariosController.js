// backend/controllers/usuariosController.js
const { getDB } = require('../db');
const { isUuid } = require('../middleware/validateUuid');

exports.getUsuarios = async (req, res, next) => {
    try {
        const pool = getDB();
        const [rows] = await pool.query(`
            SELECT u.id, u.username, u.role, r.nombre AS rol_nombre, r.alcance,
                   u.local_id, l.nombre AS local_nombre, u.trabajador_id,
                   CONCAT(t.nombre, ' ', t.apellido) AS trabajador_nombre
            FROM users u
            LEFT JOIN roles r ON r.id = u.role
            LEFT JOIN locales l ON l.id = u.local_id
            LEFT JOIN trabajadores t ON t.id = u.trabajador_id
            ORDER BY FIELD(u.role, 'admin', 'encargado') DESC, l.nombre, u.username`);
        const [ul] = await pool.query('SELECT user_id, local_id FROM usuario_locales');
        res.json(rows.map(u => ({
            ...u,
            rol_nombre: u.rol_nombre || u.role,
            locales_asignados: ul.filter(x => x.user_id === u.id).map(x => x.local_id),
        })));
    } catch (err) { next(err); }
};

// Cambia el rol de un usuario y, si el rol es de varios locales, los locales a los que puede ingresar.
exports.actualizarUsuario = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { rol, locales } = req.body || {};
        const pool = getDB();

        if (id === req.user.id) return res.status(403).json({ message: 'No puedes cambiar tu propio rol.' });
        const [us] = await pool.query('SELECT id, role, trabajador_id FROM users WHERE id = ?', [id]);
        if (us.length === 0) return res.status(404).json({ message: 'Usuario no encontrado.' });
        const usuario = us[0];

        const [rs] = await pool.query('SELECT id, alcance FROM roles WHERE id = ?', [rol]);
        if (rs.length === 0) return res.status(400).json({ message: 'El rol indicado no existe.' });
        const nuevo = rs[0];

        // Siempre debe quedar al menos un administrador
        if (usuario.role === 'admin' && nuevo.id !== 'admin') {
            const [a] = await pool.query("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'");
            if (a[0].n <= 1) return res.status(409).json({ message: 'Debe quedar al menos un administrador.' });
        }

        let asignados = [];
        if (nuevo.alcance === 'multi') {
            asignados = Array.isArray(locales) ? [...new Set(locales)] : [];
            if (asignados.length === 0 || asignados.some(l => !isUuid(l))) {
                return res.status(400).json({ message: 'Elige al menos un local para este rol.' });
            }
            const [ok] = await pool.query('SELECT id FROM locales WHERE id IN (?)', [asignados]);
            if (ok.length !== asignados.length) return res.status(400).json({ message: 'Algún local indicado no existe.' });
        }

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            await conn.query('UPDATE users SET role = ? WHERE id = ?', [nuevo.id, id]);
            await conn.query('DELETE FROM usuario_locales WHERE user_id = ?', [id]);
            for (const l of asignados) await conn.query('INSERT INTO usuario_locales (user_id, local_id) VALUES (?, ?)', [id, l]);
            await conn.commit();
        } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }

        res.json({ id, rol: nuevo.id, locales_asignados: asignados });
    } catch (err) { next(err); }
};
