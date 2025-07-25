// backend/controllers/localesController.js
const { getDb } = require('../db');

exports.getAllLocales = async (req, res, next) => {
    try {
        const pool = getDb();
        // NOTA: 'servicios' ya no se selecciona de la tabla 'locales'
        const [rows] = await pool.query('SELECT id, type, nombre, direccion, telefono, horario, peluqueros, ingresosMes, clientesActivos, imagen, estado, username, password FROM locales');
        const locales = rows.map(row => ({
            ...row,
            peluqueros: parseInt(row.peluqueros, 10),
            ingresosMes: parseFloat(row.ingresosMes),
            clientesActivos: parseInt(row.clientesActivos, 10)
        }));
        res.json(locales);
    } catch (err) {
        next(err);
    }
};

exports.getLocaleById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const pool = getDb();
        // NOTA: 'servicios' ya no se selecciona de la tabla 'locales'
        const [rows] = await pool.query('SELECT id, type, nombre, direccion, telefono, horario, peluqueros, ingresosMes, clientesActivos, imagen, estado, username, password FROM locales WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Local no encontrado.' });
        }
        const local = {
            ...rows[0],
            peluqueros: parseInt(rows[0].peluqueros, 10),
            ingresosMes: parseFloat(rows[0].ingresosMes),
            clientesActivos: parseInt(rows[0].clientesActivos, 10)
        };
        res.json(local);
    } catch (err) {
        next(err);
    }
};

exports.createLocale = async (req, res, next) => {
    // NOTA: 'servicios' ya no se espera para insertar en la tabla 'locales'
    const { type, nombre, direccion, telefono, horario, peluqueros, ingresosMes, clientesActivos, imagen, estado, username, password } = req.body;

    if (!nombre || !username || !password) {
        return res.status(400).json({ message: 'Nombre, usuario y contraseña del local son obligatorios.' });
    }

    let newLocalId;

    try {
        const pool = getDb();
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // 1. Insertar el local en la tabla 'locales' (sin columna 'servicios')
            const [localResult] = await connection.query(
                `INSERT INTO locales (type, nombre, direccion, telefono, horario, peluqueros, ingresosMes, clientesActivos, imagen, estado, username, password)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [type || 'peluqueria', nombre, direccion || null, telefono || null, horario || null, peluqueros || 0, ingresosMes || 0, clientesActivos || 0, imagen || null, estado || 'Activo', username, password]
            );

            newLocalId = localResult.insertId;

            // 2. Insertar también en la tabla 'users'
            await connection.query(
                `INSERT INTO users (username, password, role, local_id)
                 VALUES (?, ?, ?, ?)`,
                [username, password, 'encargado', newLocalId]
            );

            await connection.commit();

            // Recuperar el local completo de la DB para devolverlo al frontend
            // NOTA: 'servicios' ya no se selecciona aquí
            const [newLocalRows] = await pool.query('SELECT * FROM locales WHERE id = ?', [newLocalId]);
            const newLocal = {
                ...newLocalRows[0],
                peluqueros: parseInt(newLocalRows[0].peluqueros, 10),
                ingresosMes: parseFloat(newLocalRows[0].ingresosMes),
                clientesActivos: parseInt(newLocalRows[0].clientesActivos, 10)
            };
            res.status(201).json(newLocal);

        } catch (transactionError) {
            await connection.rollback();
            throw transactionError;
        } finally {
            connection.release();
        }

    } catch (err) {
        next(err);
    }
};

exports.deleteLocale = async (req, res, next) => {
    const { id } = req.params;

    try {
        const pool = getDb();
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // 1. Eliminar servicios asociados a este local_id (NUEVO)
            await connection.query('DELETE FROM servicios WHERE local_id = ?', [id]);
            console.log(`Servicios del local ${id} eliminados.`);

            // 2. Eliminar trabajadores asociados a este local_id
            await connection.query('DELETE FROM trabajadores WHERE local_id = ?', [id]);
            console.log(`Trabajadores del local ${id} eliminados.`);

            // 3. Eliminar el usuario asociado a este local_id
            await connection.query('DELETE FROM users WHERE local_id = ?', [id]);
            console.log(`Usuario del local ${id} eliminado.`);
            
            // 4. Eliminar el local de la tabla 'locales'
            const [localDeleteResult] = await connection.query('DELETE FROM locales WHERE id = ?', [id]);

            if (localDeleteResult.affectedRows === 0) {
                await connection.rollback();
                return res.status(404).json({ message: 'Local no encontrado para eliminar.' });
            }

            await connection.commit();

            res.status(200).json({ message: 'Local, usuario, trabajadores y servicios asociados eliminados exitosamente.' });

        } catch (transactionError) {
            await connection.rollback();
            throw transactionError;
        } finally {
            connection.release();
        }

    } catch (err) {
        next(err);
    }
};