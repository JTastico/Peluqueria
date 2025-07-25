const db = require('../db'); // Asegúrate de que esta línea esté presente y al inicio

// Función auxiliar para obtener el nombre de la tabla de clientes dinámicamente
const getClientTableName = async (localId) => {
    const connection = db.getDB(); 
    if (!connection) {
        throw new Error('No hay conexión a la base de datos.');
    }
    const [rows] = await connection.query('SELECT tipo_local FROM locales WHERE id = ?', [localId]);
    if (rows.length === 0) {
        throw new Error('Local no encontrado para determinar la tabla de clientes.');
    }
    const tipoLocal = rows[0].tipo_local;
    switch (tipoLocal) {
        case 'spa':
            return 'cliente_spa';
        case 'barberia':
            return 'cliente_barberia';
        case 'peluqueria':
            return 'cliente_peluqueria';
        default:
            throw new Error('Tipo de local desconocido para la gestión de clientes.');
    }
};

// Crear una nueva cita/cliente
exports.createClienteCita = async (req, res, next) => {
    try {
        const { nombre, apellido, telefono, email, fechaCita, horaCita, servicioId, trabajadorId, localId, notas } = req.body;

        if (!localId) {
            return res.status(400).json({ message: 'Se requiere el ID del local para registrar el cliente.' });
        }

        const tableName = await getClientTableName(localId);
        const connection = db.getDB(); 
        
        const [result] = await connection.query(
            `INSERT INTO ${tableName} (nombre, apellido, telefono, email, fecha_cita, hora_cita, servicio_id, trabajador_id, local_id, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [nombre, apellido || null, telefono || null, email || null, fechaCita, horaCita, servicioId, trabajadorId || null, localId, notas || null]
        );

        res.status(201).json({ id: result.insertId, message: 'Cliente registrado exitosamente en ' + tableName });
    } catch (error) {
        console.error('Error al crear cliente:', error);
        next(error);
    }
};

// Obtener todos los clientes (filtrados por localId)
exports.getAllClientes = async (req, res, next) => {
    try {
        const { localId } = req.query; 

        if (!localId) {
            return res.status(400).json({ message: 'Se requiere un localId para obtener todos los clientes de un tipo específico.' });
        }

        const tableName = await getClientTableName(localId);
        const connection = db.getDB(); 
        
        const [rows] = await connection.query(`SELECT * FROM ${tableName} WHERE local_id = ?`, [localId]);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        next(error);
    }
};

// Obtener un cliente por ID (requiere localId para saber de qué tabla buscar)
exports.getClienteById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { localId } = req.query; 

        if (!localId) {
            return res.status(400).json({ message: 'Se requiere localId para obtener un cliente por ID.' });
        }

        const tableName = await getClientTableName(localId);
        const connection = db.getDB(); 

        const [rows] = await connection.query(`SELECT * FROM ${tableName} WHERE id = ? AND local_id = ?`, [id, localId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Cliente no encontrado en el local especificado.' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error al obtener cliente por ID:', error);
        next(error);
    }
};

// Actualizar un cliente
exports.updateCliente = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { localId, ...updateData } = req.body; 

        if (!localId) {
            return res.status(400).json({ message: 'Se requiere localId para actualizar el cliente.' });
        }

        const tableName = await getClientTableName(localId);
        const connection = db.getDB(); 

        const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updateData);

        const [result] = await connection.query(
            `UPDATE ${tableName} SET ${fields} WHERE id = ? AND local_id = ?`,
            [...values, id, localId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Cliente no encontrado o no se realizaron cambios.' });
        }

        res.json({ message: 'Cliente actualizado exitosamente.' });
    } catch (error) {
        console.error('Error al actualizar cliente:', error);
        next(error);
    }
};

// Eliminar un cliente
exports.deleteCliente = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { localId } = req.query; 

        if (!localId) {
            return res.status(400).json({ message: 'Se requiere localId para eliminar el cliente.' });
        }

        const tableName = await getClientTableName(localId);
        const connection = db.getDB(); 

        const [result] = await connection.query(`DELETE FROM ${tableName} WHERE id = ? AND local_id = ?`, [id, localId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Cliente no encontrado en el local especificado.' });
        }

        res.json({ message: 'Cliente eliminado exitosamente.' });
    } catch (error) {
        console.error('Error al eliminar cliente:', error);
        next(error);
    }
};