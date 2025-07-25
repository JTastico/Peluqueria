// backend/controllers/localesController.js
const { getDB } = require('../db'); 

exports.getAllLocales = async (req, res, next) => {
    try {
        const connection = getDB(); 
        const [rows] = await connection.query(`
            SELECT 
                id, 
                nombre, 
                tipo_local,      
                direccion, 
                telefono, 
                horario, 
                numero_peluqueros, 
                ingreso_mensual,   
                clientes_activos,
                imagen,            -- AÑADIDO: Seleccionar imagen
                estado             -- AÑADIDO: Seleccionar estado
            FROM locales
        `);
        
        const locales = rows.map(row => ({
            ...row,
            type: row.tipo_local,
            peluqueros: parseInt(row.numero_peluqueros, 10), 
            ingresosMes: parseFloat(row.ingreso_mensual),     
            clientesActivos: parseInt(row.clientes_activos, 10)   
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
        const connection = getDB(); 
        const [rows] = await connection.query(`
            SELECT 
                id, 
                nombre, 
                tipo_local,      
                direccion, 
                telefono, 
                horario, 
                numero_peluqueros, 
                ingreso_mensual,   
                clientes_activos,
                imagen,            -- AÑADIDO: Seleccionar imagen
                estado             -- AÑADIDO: Seleccionar estado
            FROM locales 
            WHERE id = ?
        `, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Local no encontrado.' });
        }
        
        const local = {
            ...rows[0],
            type: rows[0].tipo_local,
            peluqueros: parseInt(rows[0].numero_peluqueros, 10), 
            ingresosMes: parseFloat(rows[0].ingreso_mensual),     
            clientesActivos: parseInt(rows[0].clientes_activos, 10)   
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
        const connection = getDB(); 
        const transactionConnection = await connection.getConnection(); 
        await transactionConnection.beginTransaction();

        try {
            // 1. Insertar el local en la tabla 'locales'
            const [localResult] = await transactionConnection.query(
                `INSERT INTO locales (nombre, tipo_local, direccion, telefono, horario, numero_peluqueros, ingreso_mensual, clientes_activos, imagen, estado)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    nombre, 
                    type || 'peluqueria', 
                    direccion || null, 
                    telefono || null, 
                    horario || null, 
                    peluqueros || 0, 
                    ingresosMes || 0, 
                    clientesActivos || 0,
                    imagen || null,      // AÑADIDO: Insertar imagen
                    estado || 'Activo'   // AÑADIDO: Insertar estado
                ]
            );

            newLocalId = localResult.insertId;

            // 2. Insertar también en la tabla 'users' para el encargado del local
            await transactionConnection.query(
                `INSERT INTO users (username, password, role, local_id)
                 VALUES (?, ?, ?, ?)`,
                [username, password, 'encargado', newLocalId]
            );

            await transactionConnection.commit();

            const [newLocalRows] = await connection.query('SELECT * FROM locales WHERE id = ?', [newLocalId]);
            const newLocal = {
                ...newLocalRows[0],
                type: newLocalRows[0].tipo_local,
                peluqueros: parseInt(newLocalRows[0].numero_peluqueros, 10),
                ingresosMes: parseFloat(newLocalRows[0].ingreso_mensual),
                clientesActivos: parseInt(newLocalRows[0].clientes_activos, 10)
            };
            res.status(201).json(newLocal);

        } catch (transactionError) {
            await transactionConnection.rollback();
            throw transactionError; 
        } finally {
            if (transactionConnection) transactionConnection.release();
        }

    } catch (err) {
        console.error('Error al crear local:', err); 
        next(err);
    }
};

exports.deleteLocale = async (req, res, next) => {
    const { id } = req.params;

    try {
        const connection = getDB(); 
        const transactionConnection = await connection.getConnection();
        await transactionConnection.beginTransaction();

        try {
            const [localRows] = await transactionConnection.query('SELECT tipo_local FROM locales WHERE id = ?', [id]);
            if (localRows.length === 0) {
                await transactionConnection.rollback();
                return res.status(404).json({ message: 'Local no encontrado para eliminar clientes asociados.' });
            }
            const tipoLocal = localRows[0].tipo_local;
            let clientTableName;
            switch (tipoLocal) {
                case 'spa': clientTableName = 'cliente_spa'; break;
                case 'barberia': clientTableName = 'cliente_barberia'; break;
                case 'peluqueria': clientTableName = 'cliente_peluqueria'; break;
                default:
                    await transactionConnection.rollback();
                    return res.status(400).json({ message: 'Tipo de local desconocido al eliminar clientes.' });
            }
            await transactionConnection.query(`DELETE FROM ${clientTableName} WHERE local_id = ?`, [id]);
            console.log(`Clientes del local ${id} (${clientTableName}) eliminados.`);

            await transactionConnection.query('DELETE FROM servicios WHERE local_id = ?', [id]);
            console.log(`Servicios del local ${id} eliminados.`);

            await transactionConnection.query('DELETE FROM trabajadores WHERE local_id = ?', [id]);
            console.log(`Trabajadores del local ${id} eliminados.`);

            await transactionConnection.query('DELETE FROM users WHERE local_id = ?', [id]);
            console.log(`Usuario del local ${id} eliminado.`);
            
            const [localDeleteResult] = await transactionConnection.query('DELETE FROM locales WHERE id = ?', [id]);

            if (localDeleteResult.affectedRows === 0) {
                await transactionConnection.rollback();
                return res.status(404).json({ message: 'Local no encontrado para eliminar.' });
            }

            await transactionConnection.commit();

            res.status(200).json({ message: 'Local, usuarios, trabajadores, servicios y clientes asociados eliminados exitosamente.' });

        } catch (transactionError) {
            await transactionConnection.rollback();
            console.error('Error en la transacción de eliminación de local:', transactionError); 
            next(transactionError); 
        } finally {
            if (transactionConnection) transactionConnection.release();
        }

    } catch (err) {
        console.error('Error al eliminar local (fuera de transacción):', err); 
        next(err);
    }
};