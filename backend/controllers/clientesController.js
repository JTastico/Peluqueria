// backend/controllers/clientesController.js
const { getDb } = require('../db');

// Crear una nueva cita/cliente (sin cambios)
exports.createClienteCita = async (req, res, next) => {
    const { nombre, apellido, fechaCita, horaCita, servicioId, trabajadorId, localId, notas } = req.body;

    if (!nombre || !fechaCita || !horaCita || !servicioId || !localId) {
        return res.status(400).json({ message: 'Nombre, fecha, hora, servicio y local son obligatorios para la cita.' });
    }

    try {
        const pool = getDb();
        const [result] = await pool.query(
            `INSERT INTO clientes (nombre, apellido, fecha_cita, hora_cita, servicio_id, trabajador_id, local_id, notas)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nombre,
                apellido || null,
                fechaCita,
                horaCita,
                servicioId,
                trabajadorId || null,
                localId,
                notas || null
            ]
        );

        const newClienteId = result.insertId;
        const [newClienteRows] = await pool.query('SELECT * FROM clientes WHERE id = ?', [newClienteId]);
        const newCliente = {
            ...newClienteRows[0],
            fecha_cita: newClienteRows[0].fecha_cita ? newClienteRows[0].fecha_cita.toISOString().split('T')[0] : null,
            hora_cita: newClienteRows[0].hora_cita ? String(newClienteRows[0].hora_cita).substring(0, 5) : null
        };
        res.status(201).json(newCliente);

    } catch (err) {
        console.error('Error al crear nueva cita:', err.message);
        next(err);
    }
};

// --- CAMBIO CLAVE AQUÍ: Obtener todos los clientes/citas con filtro por local_id ---
exports.getAllClientes = async (req, res, next) => {
    const { local_id } = req.query; // Obtener local_id de los query params (ej. ?local_id=1)

    try {
        const pool = getDb();
        let query = `
            SELECT 
                c.id, 
                c.nombre, 
                c.apellido, 
                c.fecha_cita, 
                c.hora_cita, 
                c.notas,
                c.fecha_registro,
                l.nombre AS local_nombre,
                s.nombre AS servicio_nombre,
                t.nombre AS trabajador_nombre,
                t.apellido AS trabajador_apellido,
                c.local_id,
                c.servicio_id,
                c.trabajador_id
            FROM clientes c
            JOIN locales l ON c.local_id = l.id
            JOIN servicios s ON c.servicio_id = s.id
            LEFT JOIN trabajadores t ON c.trabajador_id = t.id
        `;
        const params = [];

        if (local_id) { // Si se proporciona local_id, añadir filtro
            query += ' WHERE c.local_id = ?';
            params.push(local_id);
        }

        query += ' ORDER BY c.fecha_cita DESC, c.hora_cita DESC'; // Asegurar ordenación

        const [rows] = await pool.query(query, params);

        const clientes = rows.map(row => ({
            ...row,
            fecha_cita: row.fecha_cita ? new Date(row.fecha_cita).toISOString().split('T')[0] : null,
            hora_cita: row.hora_cita ? String(row.hora_cita).substring(0, 5) : null
        }));
        res.json(clientes);
    } catch (err) {
        console.error('Error al obtener clientes:', err.message);
        next(err);
    }
};

// Eliminar un cliente/cita (sin cambios)
exports.deleteCliente = async (req, res, next) => {
    const { id } = req.params;
    try {
        const pool = getDb();
        const [result] = await pool.query('DELETE FROM clientes WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Cita de cliente no encontrada para eliminar.' });
        }
        res.status(200).json({ message: 'Cita de cliente eliminada exitosamente.' });

    } catch (err) {
        console.error('Error al eliminar cita:', err.message);
        next(err);
    }
};