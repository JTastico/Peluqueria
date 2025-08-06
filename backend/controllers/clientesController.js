const db = require('../db');

// Función auxiliar para obtener el nombre de la tabla de clientes dinámicamente
const getClientTableName = async (localId) => {
    const connection = db.getDB();
    if (!connection) {
        throw new Error('No hay conexión a la base de datos.');
    }
    // Usar 'type' de la tabla locales
    const [rows] = await connection.query('SELECT type FROM locales WHERE id = ?', [localId]);
    if (rows.length === 0) {
        throw new Error('Local no encontrado para determinar la tabla de clientes.');
    }
    const tipoLocal = rows[0].type;
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
        // REMOVIDO: telefono, email del destructuring del body
        const { nombre, apellido, fechaCita, horaCita, servicioId, trabajadorId, localId, notas } = req.body;

        if (!nombre || !fechaCita || !horaCita || !servicioId || !localId) {
            return res.status(400).json({ message: 'Nombre, fecha, hora, servicio y local son obligatorios para la cita.' });
        }

        const tableName = await getClientTableName(localId);
        const connection = db.getDB();

        const [result] = await connection.query(
            // REMOVIDO: telefono, email de la lista de columnas para INSERT
            `INSERT INTO ${tableName} (nombre, apellido, fecha_cita, hora_cita, servicio_id, trabajador_id, local_id, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            // REMOVIDO: telefono, email de los valores a insertar
            [nombre, apellido || null, fechaCita, horaCita, servicioId, trabajadorId || null, localId, notas || null]
        );

        res.status(201).json({ id: result.insertId, message: 'Cliente registrado exitosamente en ' + tableName });
    } catch (error) {
        console.error('Error al crear cliente:', error);
        next(error);
    }
};

// Obtener todos los clientes (filtrados por localId o todos para admin)
exports.getAllClientes = async (req, res, next) => {
    try {
        const { localId } = req.query;

        const connection = db.getDB();
        let allClients = [];

        if (localId) {
            // Caso de usuario de local específico
            const tableName = await getClientTableName(localId);

            console.log(`Buscando clientes para localId: ${localId} en la tabla: ${tableName}`);

            const [rows] = await connection.query(`
                SELECT
                    c.id, c.nombre, c.apellido,
                    c.fecha_cita, c.hora_cita, c.notas, c.fecha_creacion,
                    l.nombre AS local_nombre, s.nombre AS servicio_nombre,
                    t.nombre AS trabajador_nombre, t.apellido AS trabajador_apellido,
                    c.local_id, c.servicio_id, c.trabajador_id
                FROM ${tableName} c
                JOIN locales l ON c.local_id = l.id
                LEFT JOIN servicios s ON c.servicio_id = s.id
                LEFT JOIN trabajadores t ON c.trabajador_id = t.id
                WHERE c.local_id = ?
                ORDER BY c.fecha_cita DESC, c.hora_cita DESC
            `, [localId]);
            allClients = rows;
        } else {
            // Caso de administrador: obtener clientes de todas las tablas
            const tableNames = ['cliente_spa', 'cliente_barberia', 'cliente_peluqueria'];
            for (const tableName of tableNames) {
                const [rows] = await connection.query(`
                    SELECT
                        c.id, c.nombre, c.apellido,
                        c.fecha_cita, c.hora_cita, c.notas, c.fecha_creacion,
                        l.nombre AS local_nombre, s.nombre AS servicio_nombre,
                        t.nombre AS trabajador_nombre, t.apellido AS trabajador_apellido,
                        c.local_id, c.servicio_id, c.trabajador_id
                    FROM ${tableName} c
                    JOIN locales l ON c.local_id = l.id
                    LEFT JOIN servicios s ON c.servicio_id = s.id
                    LEFT JOIN trabajadores t ON c.trabajador_id = t.id
                    ORDER BY c.fecha_cita DESC, c.hora_cita DESC
                `);
                allClients = allClients.concat(rows);
            }
        }

        // Formatear fechas y horas
        const formattedClients = allClients.map(row => ({
            ...row,
            fecha_cita: row.fecha_cita ? new Date(row.fecha_cita).toISOString().split('T')[0] : null,
            hora_cita: row.hora_cita ? String(row.hora_cita).substring(0, 5) : null
        }));

        res.json(formattedClients);
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