// backend/utils/usuarios.js
// Carga el usuario con su rol, permisos, locales a los que llega y preferencias.

const FUENTES = ['predeterminada', 'clasica', 'redondeada', 'legible', 'monoespaciada'];
const TAMANOS = ['pequeno', 'normal', 'grande', 'extra'];

const cargarUsuario = async (pool, id) => {
    const [rows] = await pool.query(
        `SELECT u.id, u.username, u.role, u.local_id, u.trabajador_id, u.pref_fuente, u.pref_tamano,
                r.nombre AS rol_nombre, r.alcance
         FROM users u LEFT JOIN roles r ON r.id = u.role
         WHERE u.id = ?`,
        [id]
    );
    if (rows.length === 0) return null;
    const u = rows[0];

    // Un rol inexistente no concede nada
    const alcance = u.alcance || 'local';
    const permsP = pool.query('SELECT permiso FROM rol_permisos WHERE rol_id = ?', [u.role]);
    const localesP = (async () => {
    if (alcance === 'global') {
        return (await pool.query('SELECT id, nombre, type FROM locales ORDER BY nombre'))[0];
    } else if (alcance === 'multi') {
        return (await pool.query(
            `SELECT l.id, l.nombre, l.type FROM locales l
             WHERE l.id IN (SELECT local_id FROM usuario_locales WHERE user_id = ?) OR l.id = ?
             ORDER BY l.nombre`,
            [u.id, u.local_id]
        ))[0];
    }
    return u.local_id
        ? (await pool.query('SELECT id, nombre, type FROM locales WHERE id = ?', [u.local_id]))[0]
        : [];
    })();
    const [[perms], locales] = await Promise.all([permsP, localesP]);

    return {
        id: u.id,
        username: u.username,
        role: u.role,
        rol_nombre: u.rol_nombre || u.role,
        alcance,
        local_id: u.local_id,
        trabajador_id: u.trabajador_id,
        permisos: perms.map(p => p.permiso),
        locales,                                   // locales a los que llega (para selectores)
        localesIds: alcance === 'global' ? null : locales.map(l => l.id), // null = todos
        preferencias: {
            fuente: FUENTES.includes(u.pref_fuente) ? u.pref_fuente : 'predeterminada',
            tamano: TAMANOS.includes(u.pref_tamano) ? u.pref_tamano : 'normal',
        },
    };
};

module.exports = { cargarUsuario, FUENTES, TAMANOS };
