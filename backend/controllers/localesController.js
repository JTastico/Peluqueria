// backend/controllers/localesController.js
const { getDB } = require('../db'); // Ahora getDB devolverá el pool

exports.getAllLocales = async (req, res, next) => {
    try {
        const pool = getDB(); // Obtener el pool
        const [rows] = await pool.query(`
            SELECT 
                id, 
                nombre, 
                type,               -- Usar 'type' si el frontend lo espera (viene del DB 'tipo_local')
                direccion, 
                telefono, 
                horario, 
                peluqueros,         -- Usar 'peluqueros' si el frontend lo espera (viene del DB 'numero_peluqueros')
                ingresosMes,        -- Usar 'ingresosMes' si el frontend lo espera (viene del DB 'ingreso_mensual')
                clientesActivos,    -- Usar 'clientesActivos' si el frontend lo espera (viene del DB 'clientes_activos')
                imagen,             
                estado,             
                username,           -- Estos campos están en la tabla locales de tu DB
                password            -- Estos campos están en la tabla locales de tu DB
            FROM locales
        `);
        
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
        const [rows] = await pool.query(`
            SELECT 
                id, 
                nombre, 
                type,               
                direccion, 
                telefono, 
                horario, 
                peluqueros,         
                ingresosMes,        
                clientesActivos,    
                imagen,             
                estado,             
                username,           
                password            
            FROM locales 
            WHERE id = ?
        `, [id]);
        
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

    let newLocalId;

    try {
        const pool = getDB(); // Obtener el pool
        const connection = await pool.getConnection(); // Obtener una conexión del pool para la transacción
        await connection.beginTransaction(); // Iniciar transacción

        try {
            // 1. Insertar el local en la tabla 'locales'
            const [localResult] = await connection.query(
                `INSERT INTO locales (nombre, type, direccion, telefono, horario, peluqueros, ingresosMes, clientesActivos, imagen, estado, username, password)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
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
                    password            
                ]
            );

            newLocalId = localResult.insertId;

            // 2. Insertar también en la tabla 'users' para el encargado del local
            await connection.query(
                `INSERT INTO users (username, password, role, local_id)
                 VALUES (?, ?, ?, ?)`,
                [username, password, 'encargado', newLocalId]
            );

            await connection.commit(); 

            // Recuperar el local completo de la DB para devolverlo al frontend
            const [newLocalRows] = await pool.query('SELECT * FROM locales WHERE id = ?', [newLocalId]);
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