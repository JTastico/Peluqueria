// backend/controllers/localesController.js
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { getDB } = require('../db'); // Ahora getDB devolverá el pool
const { filtroLocal } = require('../utils/alcance');

// Estadísticas calculadas en vivo desde las ventas del mes en curso.
const LOCAL_COLUMNS = `
    l.id, l.nombre, l.type, l.direccion, l.telefono, l.horario, l.imagen, l.estado, l.username,
    (SELECT COUNT(*) FROM trabajador_locales tl WHERE tl.local_id = l.id AND tl.estado = 'activo') AS peluqueros,
    (SELECT COALESCE(SUM(v.total), 0) FROM ventas v
        WHERE v.local_id = l.id AND v.estado = 'activa' AND v.fecha_hora >= DATE_FORMAT(NOW(), '%Y-%m-01')) AS ingresosMes,
    (SELECT COUNT(*) FROM ventas v
        WHERE v.local_id = l.id AND v.estado = 'activa' AND v.fecha_hora >= DATE_FORMAT(NOW(), '%Y-%m-01')) AS clientesActivos
`;


exports.getAllLocales = async (req, res, next) => {
    try {
        const pool = getDB(); // Obtener el pool
        const fl = filtroLocal(req.localScope, 'l.id');
        const [rows] = await pool.query(`SELECT ${LOCAL_COLUMNS} FROM locales l WHERE ${fl.sql}`, fl.params);
        
        // Mapeo para asegurar que los nombres de las propiedades coinciden con el frontend
        const locales = rows.map(row => ({
            ...row,
            type: row.type || 'peluqueria', 
            peluqueros: parseInt(row.peluqueros, 10) || 0, 
            ingresosMes: parseFloat(row.ingresosMes) || 0,     
            clientesActivos: parseInt(row.clientesActivos, 10) || 0   
        }));
        res.json(locales);
    } catch (err) {
        console.error('Error al obtener todos los locales:', err); 
        next(err);
    }
};

exports.getLocaleById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const pool = getDB(); // Obtener el pool
        const [rows] = await pool.query(`SELECT ${LOCAL_COLUMNS} FROM locales l WHERE l.id = ?`, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Local no encontrado.' });
        }
        
        const local = {
            ...rows[0],
            type: rows[0].type || 'peluqueria',
            peluqueros: parseInt(rows[0].peluqueros, 10) || 0,
            ingresosMes: parseFloat(rows[0].ingresosMes) || 0,
            clientesActivos: parseInt(rows[0].clientesActivos, 10) || 0
        };
        res.json(local);
    } catch (err) {
        console.error('Error al obtener local por ID:', err); 
        next(err);
    }
};

exports.createLocale = async (req, res, next) => {
    const { type, nombre, direccion, telefono, horario, peluqueros, ingresosMes, clientesActivos, imagen, estado, username, password } = req.body;

    if (!nombre || !username || !password) {
        return res.status(400).json({ message: 'Nombre, usuario y contraseña del local son obligatorios.' });
    }
    if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
        return res.status(400).json({ message: 'La contraseña del encargado debe tener entre 8 y 72 caracteres.' });
    }

    const newLocalId = crypto.randomUUID();

    try {
        const pool = getDB(); // Obtener el pool
        const connection = await pool.getConnection(); // Obtener una conexión del pool para la transacción
        await connection.beginTransaction(); // Iniciar transacción

        try {
            // 1. Insertar el local en la tabla 'locales'
            await connection.query(
                `INSERT INTO locales (id, nombre, type, direccion, telefono, horario, peluqueros, ingresosMes, clientesActivos, imagen, estado, username, password)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    newLocalId,
                    nombre, 
                    type || 'peluqueria', 
                    direccion || null, 
                    telefono || null, 
                    horario || null, 
                    peluqueros || 0, 
                    ingresosMes || 0, 
                    clientesActivos || 0,
                    imagen || null,      
                    estado || 'Activo',   
                    username,
                    '' // la contraseña vive (con hash) solo en la tabla users
                ]
            );

            // 2. Insertar también en la tabla 'users' para el encargado del local
            await connection.query(
                `INSERT INTO users (id, username, password, role, local_id)
                 VALUES (?, ?, ?, ?, ?)`,
                [crypto.randomUUID(), username, await bcrypt.hash(password, 10), 'encargado', newLocalId]
            );

            await connection.commit(); 

            // Recuperar el local completo de la DB para devolverlo al frontend
            const [newLocalRows] = await pool.query(`SELECT ${LOCAL_COLUMNS} FROM locales l WHERE l.id = ?`, [newLocalId]);
            const newLocal = {
                ...newLocalRows[0],
                type: newLocalRows[0].type || 'peluqueria',
                peluqueros: parseInt(newLocalRows[0].peluqueros, 10) || 0,
                ingresosMes: parseFloat(newLocalRows[0].ingresosMes) || 0,
                clientesActivos: parseInt(newLocalRows[0].clientesActivos, 10) || 0
            };
            res.status(201).json(newLocal);

        } catch (transactionError) {
            await connection.rollback(); 
            throw transactionError; 
        } finally {
            if (connection) connection.release(); 
        }

    } catch (err) {
        console.error('Error al crear local:', err); 
        next(err);
    }
};

exports.deleteLocale = async (req, res, next) => {
    const { id } = req.params;

    try {
        const pool = getDB(); 
        const connection = await pool.getConnection(); 
        await connection.beginTransaction(); 

        try {
            const [localRows] = await connection.query('SELECT type FROM locales WHERE id = ?', [id]);
            if (localRows.length === 0) {
                await connection.rollback();
                return res.status(404).json({ message: 'Local no encontrado para eliminar clientes asociados.' });
            }
            const localType = localRows[0].type; 
            let clientTableName;
            switch (localType) {
                case 'spa': clientTableName = 'cliente_spa'; break;
                case 'barberia': clientTableName = 'cliente_barberia'; break;
                case 'peluqueria': clientTableName = 'cliente_peluqueria'; break;
                default:
                    await connection.rollback();
                    return res.status(400).json({ message: 'Tipo de local desconocido al eliminar clientes.' });
            }
            await connection.query(`DELETE FROM ${clientTableName} WHERE local_id = ?`, [id]);
            console.log(`Clientes del local ${id} (${clientTableName}) eliminados.`);

                        await connection.query('DELETE FROM servicios WHERE local_id = ?', [id]);
            console.log(`Servicios del local ${id} eliminados.`);

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

            res.status(200).json({ message: 'Local, usuarios, trabajadores, servicios y clientes asociados eliminados exitosamente.' });

        } catch (transactionError) {
            await connection.rollback();
            console.error('Error en la transacción de eliminación de local:', transactionError); 
            next(transactionError); 
        } finally {
            if (connection) connection.release(); 
        }

    } catch (err) {
        console.error('Error al eliminar local (fuera de transacción):', err); 
        next(err);
    }
};