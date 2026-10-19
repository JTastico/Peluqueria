// backend/schema/ventas.js
// Ventas (lo que se cobra al cliente) y sus servicios, con el reparto trabajador/local congelado.
const crypto = require('crypto');
const { IDS, ROLES_BASE } = require('../permisos');
const { asegurarColumna } = require('./seguridad');

const tablaExiste = async (pool, tabla) => {
    const [r] = await pool.query(
        'SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?', [tabla]);
    return r[0].n > 0;
};

const flag = async (pool, clave) => {
    const [r] = await pool.query('SELECT valor FROM configuracion WHERE clave = ?', [clave]);
    return r.length > 0 && r[0].valor === '1';
};
const marcar = (pool, clave) => pool.query(
    "INSERT INTO configuracion (clave, valor) VALUES (?, '1') ON DUPLICATE KEY UPDATE valor = '1'", [clave]);

const crearEsquemaVentas = async (pool) => {
    // Cada servicio guarda qué porcentaje de su precio es para el trabajador (el resto es del local)
    await asegurarColumna(pool, 'servicios', 'porcentaje_trabajador', 'DECIMAL(5,2) NOT NULL DEFAULT 50.00');

    await pool.execute(`
        CREATE TABLE IF NOT EXISTS ventas (
            id CHAR(36) PRIMARY KEY,
            local_id CHAR(36) NOT NULL,
            fecha_hora DATETIME NOT NULL,
            total DECIMAL(10, 2) NOT NULL,
            metodo_pago VARCHAR(30) NOT NULL DEFAULT 'efectivo',
            estado VARCHAR(10) NOT NULL DEFAULT 'activa',
            registrado_por VARCHAR(255) NOT NULL DEFAULT '',
            creado DATETIME NOT NULL,
            INDEX idx_ventas_local_fecha (local_id, fecha_hora),
            INDEX idx_ventas_fecha (fecha_hora),
            FOREIGN KEY (local_id) REFERENCES locales(id) ON DELETE CASCADE
        )
    `);
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS venta_items (
            id CHAR(36) PRIMARY KEY,
            venta_id CHAR(36) NOT NULL,
            servicio_id CHAR(36) NULL,
            servicio_nombre VARCHAR(255) NOT NULL,
            trabajador_id CHAR(36) NULL,
            trabajador_nombre VARCHAR(255) NOT NULL,
            precio DECIMAL(10, 2) NOT NULL,
            porcentaje_trabajador DECIMAL(5, 2) NOT NULL,
            monto_trabajador DECIMAL(10, 2) NOT NULL,
            monto_local DECIMAL(10, 2) NOT NULL,
            INDEX idx_items_venta (venta_id),
            INDEX idx_items_trabajador (trabajador_id),
            FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
            FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE SET NULL,
            FOREIGN KEY (trabajador_id) REFERENCES trabajadores(id) ON DELETE SET NULL
        )
    `);

    // ---- Migración al flujo "dueño y encargada" (se ejecuta una sola vez) ----
    if (!(await flag(pool, 'migracion_ventas'))) {
        // Los trabajadores ya no tienen cuenta: quedan solo como registros
        await pool.query("DELETE FROM users WHERE role IN ('trabajador', 'itinerante')");
        await pool.query("DELETE FROM roles WHERE id IN ('trabajador', 'itinerante')");
        await pool.query("UPDATE roles SET nombre = 'Dueño' WHERE id = 'admin'");
        await pool.query("UPDATE roles SET nombre = 'Encargada' WHERE id = 'encargado'");

        // La encargada queda con los permisos del nuevo flujo
        const enc = ROLES_BASE.find(r => r.id === 'encargado');
        await pool.query("DELETE FROM rol_permisos WHERE rol_id = 'encargado'");
        for (const p of enc.permisos) await pool.query('INSERT INTO rol_permisos (rol_id, permiso) VALUES (?, ?)', ['encargado', p]);

        // Lo que ya se había cobrado con tickets pasa a ser ventas (una venta con un servicio)
        if (await tablaExiste(pool, 'tickets')) {
            const [cobrados] = await pool.query(`
                SELECT t.id, t.local_id, t.servicio_id, t.servicio_nombre, t.trabajador_id, t.trabajador_nombre,
                       t.monto, t.metodo_pago, t.hora_salida, COALESCE(s.porcentaje_trabajador, 50) AS pct
                FROM tickets t LEFT JOIN servicios s ON s.id = t.servicio_id
                WHERE t.estado = 'cobrado' AND t.hora_salida IS NOT NULL`);
            for (const t of cobrados) {
                const ventaId = crypto.randomUUID();
                const monto = Number(t.monto);
                const parteTrab = Math.round(monto * Number(t.pct)) / 100;
                await pool.query(
                    `INSERT INTO ventas (id, local_id, fecha_hora, total, metodo_pago, estado, registrado_por, creado)
                     VALUES (?, ?, ?, ?, ?, 'activa', 'migración', NOW())`,
                    [ventaId, t.local_id, t.hora_salida, monto, t.metodo_pago || 'efectivo']);
                await pool.query(
                    `INSERT INTO venta_items (id, venta_id, servicio_id, servicio_nombre, trabajador_id, trabajador_nombre,
                                              precio, porcentaje_trabajador, monto_trabajador, monto_local)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [crypto.randomUUID(), ventaId, t.servicio_id, t.servicio_nombre, t.trabajador_id, t.trabajador_nombre,
                     monto, t.pct, parteTrab, Math.round((monto - parteTrab) * 100) / 100]);
            }
            if (cobrados.length) console.log(`Tickets cobrados migrados a ventas: ${cobrados.length}.`);
        }
        await marcar(pool, 'migracion_ventas');
        console.log('Migración al flujo de ventas completada.');
    }

    // Ya no existen permisos de tickets/clientes: se limpian de todos los roles; el dueño tiene todos
    await pool.query('DELETE FROM rol_permisos WHERE permiso NOT IN (?)', [IDS]);
    for (const p of IDS) await pool.query("INSERT IGNORE INTO rol_permisos (rol_id, permiso) VALUES ('admin', ?)", [p]);

    // Los horarios de acceso de trabajadores ya no aplican (no tienen cuenta)
    await pool.query('DROP TABLE IF EXISTS horarios_acceso');
};

module.exports = { crearEsquemaVentas, tablaExiste };
