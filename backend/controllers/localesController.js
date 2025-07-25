// backend/controllers/localesController.js
const { getDb } = require('../db');

exports.getAllLocales = async (req, res, next) => {
    try {
        const pool = getDb();
        const [rows] = await pool.query('SELECT id, type, nombre, direccion, telefono, horario, peluqueros, ingresosMes, clientesActivos, imagen, estado, username, password, servicios FROM locales');
        const locales = rows.map(row => ({
            ...row,
            peluqueros: parseInt(row.peluqueros, 10),
            ingresosMes: parseFloat(row.ingresosMes),
            clientesActivos: parseInt(row.clientesActivos, 10),
            servicios: JSON.parse(row.servicios)
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
        const [rows] = await pool.query('SELECT id, type, nombre, direccion, telefono, horario, peluqueros, ingresosMes, clientesActivos, imagen, estado, username, password, servicios FROM locales WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Local no encontrado.' });
        }
        const local = {
            ...rows[0],
            peluqueros: parseInt(rows[0].peluqueros, 10),
            ingresosMes: parseFloat(rows[0].ingresosMes),
            clientesActivos: parseInt(rows[0].clientesActivos, 10),
            servicios: JSON.parse(rows[0].servicios)
        };
        res.json(local);
    } catch (err) {
        next(err);
    }
};

exports.createLocale = async (req, res, next) => {
    const { type, nombre, direccion, telefono, horario, peluqueros, ingresosMes, clientesActivos, imagen, estado, username, password, servicios } = req.body;

    if (!nombre || !username || !password) {
        return res.status(400).json({ message: 'Nombre, usuario y contraseña del local son obligatorios.' });
    }

    let newLocalId;

    try {
        const pool = getDb();
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            const [localResult] = await connection.query(
                `INSERT INTO locales (type, nombre, direccion, telefono, horario, peluqueros, ingresosMes, clientesActivos, imagen, estado, username, password, servicios)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [type || 'peluqueria', nombre, direccion || null, telefono || null, horario || null, peluqueros || 0, ingresosMes || 0, clientesActivos || 0, imagen || null, estado || 'Activo', username, password, JSON.stringify(servicios || [])]
            );

            newLocalId = localResult.insertId;

            await connection.query(
                `INSERT INTO users (username, password, role, local_id)
                 VALUES (?, ?, ?, ?)`,
                [username, password, 'encargado', newLocalId]
            );

            await connection.commit();

            const [newLocalRows] = await pool.query('SELECT * FROM locales WHERE id = ?', [newLocalId]);
            const newLocal = {
                ...newLocalRows[0],
                peluqueros: parseInt(newLocalRows[0].peluqueros, 10),
                ingresosMes: parseFloat(newLocalRows[0].ingresosMes),
                clientesActivos: parseInt(newLocalRows[0].clientesActivos, 10),
                servicios: JSON.parse(newLocalRows[0].servicios)
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
            await connection.query('DELETE FROM trabajadores WHERE local_id = ?', [id]);
            console.log(`Trabajadores del local ${id} eliminados.`);

            await connection.query('DELETE FROM users WHERE local_id = ?', [id]);
            console.log(`Usuario del local ${id} eliminado.`);
            
            const [localDeleteResult] = await connection.query('DELETE FROM locales WHERE id = ?', [id]);

            if (localDeleteResult.affectedRows === 0) {
                await connection.rollback();
                return res.status(404).json({ message: 'Local no encontrado para eliminar.' });
            }

            await connection.commit();

            res.status(200).json({ message: 'Local, usuario y trabajadores asociados eliminados exitosamente.' });

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