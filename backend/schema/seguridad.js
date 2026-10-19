// backend/schema/seguridad.js
// Tablas y migraciones de roles, permisos, asignaciones de trabajadores, horarios y apariencia.
const crypto = require('crypto');
const { ROLES_BASE, IDS } = require('../permisos');

const columnaExiste = async (pool, tabla, columna) => {
    const [r] = await pool.query(
        'SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
        [tabla, columna]
    );
    return r[0].n > 0;
};

const asegurarColumna = async (pool, tabla, columna, ddl) => {
    if (!(await columnaExiste(pool, tabla, columna))) {
        await pool.query(`ALTER TABLE ${tabla} ADD COLUMN ${columna} ${ddl}`);
        console.log(`Columna ${tabla}.${columna} agregada.`);
    }
};

const crearEsquemaSeguridad = async (pool) => {
    // --- Roles y permisos ---
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS roles (
            id VARCHAR(40) PRIMARY KEY,
            nombre VARCHAR(80) NOT NULL,
            descripcion VARCHAR(255) NOT NULL DEFAULT '',
            alcance VARCHAR(10) NOT NULL DEFAULT 'local',
            sujeto_horario TINYINT NOT NULL DEFAULT 0,
            es_sistema TINYINT NOT NULL DEFAULT 0
        )
    `);
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS rol_permisos (
            rol_id VARCHAR(40) NOT NULL,
            permiso VARCHAR(60) NOT NULL,
            PRIMARY KEY (rol_id, permiso),
            FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE
        )
    `);
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS usuario_locales (
            user_id CHAR(36) NOT NULL,
            local_id CHAR(36) NOT NULL,
            PRIMARY KEY (user_id, local_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (local_id) REFERENCES locales(id) ON DELETE CASCADE
        )
    `);

    // Roles base: se crean solo si no existen (así se respetan las ediciones del administrador).
    for (const rol of ROLES_BASE) {
        const [ex] = await pool.query('SELECT id FROM roles WHERE id = ?', [rol.id]);
        if (ex.length === 0) {
            await pool.query(
                'INSERT INTO roles (id, nombre, descripcion, alcance, sujeto_horario, es_sistema) VALUES (?, ?, ?, ?, 0, ?)',
                [rol.id, rol.nombre, rol.descripcion, rol.alcance, rol.es_sistema]
            );
            for (const p of rol.permisos) {
                await pool.query('INSERT INTO rol_permisos (rol_id, permiso) VALUES (?, ?)', [rol.id, p]);
            }
            console.log(`Rol base creado: ${rol.id}.`);
        }
    }
    // El administrador siempre tiene todos los permisos del catálogo (incluidos los nuevos).
    for (const p of IDS) {
        await pool.query('INSERT IGNORE INTO rol_permisos (rol_id, permiso) VALUES (?, ?)', ['admin', p]);
    }

    // --- Preferencias de apariencia por usuario ---
    await asegurarColumna(pool, 'users', 'pref_fuente', "VARCHAR(20) NOT NULL DEFAULT 'predeterminada'");
    await asegurarColumna(pool, 'users', 'pref_tamano', "VARCHAR(10) NOT NULL DEFAULT 'normal'");

    // --- Historial de trabajadores por local (pausa y reanudación) ---
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS trabajador_locales (
            trabajador_id CHAR(36) NOT NULL,
            local_id CHAR(36) NOT NULL,
            estado VARCHAR(10) NOT NULL DEFAULT 'activo',
            desde DATETIME NOT NULL,
            actualizado DATETIME NOT NULL,
            PRIMARY KEY (trabajador_id, local_id),
            FOREIGN KEY (trabajador_id) REFERENCES trabajadores(id) ON DELETE CASCADE,
            FOREIGN KEY (local_id) REFERENCES locales(id) ON DELETE CASCADE
        )
    `);
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS trabajador_movimientos (
            id CHAR(36) PRIMARY KEY,
            trabajador_id CHAR(36) NOT NULL,
            local_origen CHAR(36) NULL,
            local_destino CHAR(36) NOT NULL,
            fecha DATETIME NOT NULL,
            motivo VARCHAR(255) NOT NULL DEFAULT '',
            usuario VARCHAR(255) NOT NULL DEFAULT '',
            INDEX idx_mov_trabajador (trabajador_id),
            FOREIGN KEY (trabajador_id) REFERENCES trabajadores(id) ON DELETE CASCADE
        )
    `);
    // Los trabajadores existentes quedan activos en su local actual.
    await pool.query(`
        INSERT IGNORE INTO trabajador_locales (trabajador_id, local_id, estado, desde, actualizado)
        SELECT t.id, t.local_id, 'activo', COALESCE(CAST(t.fecha_ingreso AS DATETIME), NOW()), NOW()
        FROM trabajadores t
        WHERE NOT EXISTS (SELECT 1 FROM trabajador_locales tl WHERE tl.trabajador_id = t.id)
    `);

    // --- Apariencia: el valor de configuración puede ser largo (p. ej. el logo en base64) ---
    const [tipo] = await pool.query(
        "SELECT DATA_TYPE AS t FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'configuracion' AND COLUMN_NAME = 'valor'"
    );
    if (tipo[0] && tipo[0].t !== 'mediumtext') {
        await pool.query('ALTER TABLE configuracion MODIFY valor MEDIUMTEXT NOT NULL');
    }
    // El primario por defecto debe cumplir el contraste mínimo con texto blanco (4.5:1)
    await pool.query("UPDATE configuracion SET valor = '#7e47eb' WHERE clave = 'tema_primario' AND valor = '#8b5cf6'");
    await pool.query(
        "INSERT IGNORE INTO configuracion (clave, valor) VALUES ('tema_primario', '#7e47eb'), ('tema_secundario', '#f59e0b'), ('tema_preset', 'lavanda'), ('logo_mime', ''), ('logo_datos', ''), ('logo_version', '0')"
    );
};

module.exports = { crearEsquemaSeguridad, columnaExiste, asegurarColumna, uuid: () => crypto.randomUUID() };
