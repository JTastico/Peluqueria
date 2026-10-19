// backend/controllers/rolesController.js
const { getDB } = require('../db');
const { GRUPOS, PERMISOS, IDS, ALCANCES } = require('../permisos');

const slug = (texto) =>
    String(texto).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
        .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);

const cargarRoles = async (pool) => {
    const [roles] = await pool.query(
        `SELECT r.id, r.nombre, r.descripcion, r.alcance, r.es_sistema,
                (SELECT COUNT(*) FROM users u WHERE u.role = r.id) AS usuarios
         FROM roles r ORDER BY r.es_sistema DESC, r.nombre`
    );
    const [perms] = await pool.query('SELECT rol_id, permiso FROM rol_permisos');
    return roles
        .map(r => ({
            ...r,
            es_sistema: !!r.es_sistema,
            usuarios: Number(r.usuarios),
            permisos: perms.filter(p => p.rol_id === r.id).map(p => p.permiso),
        }))
        // Orden estable: admin primero, luego los demás de base y los creados por último
        .sort((a, b) => (a.id === 'admin' ? -1 : b.id === 'admin' ? 1 : Number(b.es_sistema) - Number(a.es_sistema)));
};

// Valida el cuerpo; devuelve { error } o los datos limpios
const validar = (body) => {
    const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
    const descripcion = typeof body.descripcion === 'string' ? body.descripcion.trim().slice(0, 255) : '';
    if (!nombre || nombre.length > 80) return { error: 'El nombre del rol es obligatorio (máximo 80 caracteres).' };
    if (!ALCANCES.includes(body.alcance)) return { error: 'El alcance del rol no es válido.' };
    if (!Array.isArray(body.permisos) || body.permisos.some(p => !IDS.includes(p))) {
        return { error: 'La lista de permisos no es válida.' };
    }
    return {
        nombre, descripcion, alcance: body.alcance,
        permisos: [...new Set(body.permisos)],
    };
};

exports.getRoles = async (req, res, next) => {
    try {
        res.json({ roles: await cargarRoles(getDB()), catalogo: { grupos: GRUPOS, permisos: PERMISOS } });
    } catch (err) { next(err); }
};

exports.crearRol = async (req, res, next) => {
    try {
        const d = validar(req.body || {});
        if (d.error) return res.status(400).json({ message: d.error });
        const id = slug(d.nombre);
        if (!id) return res.status(400).json({ message: 'El nombre del rol no es válido.' });

        const pool = getDB();
        const [ex] = await pool.query('SELECT id FROM roles WHERE id = ?', [id]);
        if (ex.length > 0) return res.status(409).json({ message: 'Ya existe un rol con ese nombre.' });

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            await conn.query(
                'INSERT INTO roles (id, nombre, descripcion, alcance, sujeto_horario, es_sistema) VALUES (?, ?, ?, ?, 0, 0)',
                [id, d.nombre, d.descripcion, d.alcance]
            );
            for (const p of d.permisos) await conn.query('INSERT INTO rol_permisos (rol_id, permiso) VALUES (?, ?)', [id, p]);
            await conn.commit();
        } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }

        const roles = await cargarRoles(pool);
        res.status(201).json(roles.find(r => r.id === id));
    } catch (err) { next(err); }
};

exports.actualizarRol = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (id === 'admin') return res.status(403).json({ message: 'El rol de administrador no se puede modificar.' });
        const d = validar(req.body || {});
        if (d.error) return res.status(400).json({ message: d.error });

        const pool = getDB();
        const [ex] = await pool.query('SELECT id FROM roles WHERE id = ?', [id]);
        if (ex.length === 0) return res.status(404).json({ message: 'Rol no encontrado.' });

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            await conn.query(
                'UPDATE roles SET nombre = ?, descripcion = ?, alcance = ? WHERE id = ?',
                [d.nombre, d.descripcion, d.alcance, id]
            );
            await conn.query('DELETE FROM rol_permisos WHERE rol_id = ?', [id]);
            for (const p of d.permisos) await conn.query('INSERT INTO rol_permisos (rol_id, permiso) VALUES (?, ?)', [id, p]);
            await conn.commit();
        } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }

        const roles = await cargarRoles(pool);
        res.json(roles.find(r => r.id === id));
    } catch (err) { next(err); }
};

exports.eliminarRol = async (req, res, next) => {
    try {
        const { id } = req.params;
        const pool = getDB();
        const [rows] = await pool.query('SELECT es_sistema FROM roles WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Rol no encontrado.' });
        if (rows[0].es_sistema) return res.status(403).json({ message: 'Los roles base del sistema no se pueden eliminar.' });
        const [u] = await pool.query('SELECT COUNT(*) AS n FROM users WHERE role = ?', [id]);
        if (u[0].n > 0) return res.status(409).json({ message: `Hay ${u[0].n} usuario(s) con este rol. Cámbiales el rol antes de eliminarlo.` });
        await pool.query('DELETE FROM roles WHERE id = ?', [id]);
        res.json({ message: 'Rol eliminado.' });
    } catch (err) { next(err); }
};
