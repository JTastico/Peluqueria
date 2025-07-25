// backend/controllers/serviciosController.js
const { getDB } = require('../db'); 

exports.getAllServicios = async (req, res, next) => {
    try {
        const pool = getDB(); 
        const { local_id } = req.query; 

        let query = `
            SELECT 
                s.id, 
                s.nombre, 
                s.categoria, 
                s.precio, 
                s.duracion, 
                s.descripcion,
                s.local_id,
                l.nombre AS local_nombre
            FROM servicios s
            JOIN locales l ON s.local_id = l.id
        `;
        const params = [];

        if (local_id) { 
            query += ' WHERE s.local_id = ?';
            params.push(local_id);
        }

        const [rows] = await pool.query(query, params);
        
        // CORRECCIÓN: Mapear los resultados y convertir 'precio' a número
        const servicios = rows.map(servicio => ({
            ...servicio,
            precio: parseFloat(servicio.precio) // Convertir la cadena de precio a un número flotante
        }));
        
        res.json(servicios); // Enviar los servicios con el precio como número
    } catch (err) {
        console.error('Error al obtener servicios:', err.message);
        next(err);
    }
};

exports.createServicio = async (req, res, next) => {
    const { nombre, categoria, precio, duracion, descripcion, local_id } = req.body;
    if (!nombre || !precio || !local_id) {
        return res.status(400).json({ message: 'Nombre, precio y local son obligatorios para el servicio.' });
    }
    try {
        const pool = getDB(); 
        const [result] = await pool.query(
            `INSERT INTO servicios (nombre, categoria, precio, duracion, descripcion, local_id)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [nombre, categoria || null, precio, duracion || null, descripcion || null, local_id]
        );
        const newServicioId = result.insertId;
        const [newServicioRows] = await pool.query('SELECT * FROM servicios WHERE id = ?', [newServicioId]);
        res.status(201).json(newServicioRows[0]);
    } catch (err) {
        console.error('Error al crear servicio:', err.message);
        next(err);
    }
};

exports.getServicioById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const pool = getDB(); 
        const [rows] = await pool.query('SELECT * FROM servicios WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Servicio no encontrado.' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('Error al obtener servicio por ID:', err.message);
        next(err);
    }
};

exports.updateServicio = async (req, res, next) => {
    const { id } = req.params;
    const { nombre, categoria, precio, duracion, descripcion, local_id } = req.body;
    try {
        const pool = getDB(); 
        const [result] = await pool.query(
            `UPDATE servicios SET nombre = ?, categoria = ?, precio = ?, duracion = ?, descripcion = ?, local_id = ? WHERE id = ?`,
            [nombre, categoria || null, precio, duracion || null, descripcion || null, local_id, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Servicio no encontrado para actualizar.' });
        }
        res.status(200).json({ message: 'Servicio actualizado exitosamente.' });
    } catch (err) {
        console.error('Error al actualizar servicio:', err.message);
        next(err);
    }
};

exports.deleteServicio = async (req, res, next) => {
    const { id } = req.params;
    try {
        const pool = getDB(); 
        const [result] = await pool.query('DELETE FROM servicios WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Servicio no encontrado para eliminar.' });
        }
        res.status(200).json({ message: 'Servicio eliminado exitosamente.' });
    } catch (err) {
        console.error('Error al eliminar servicio:', err.message);
        next(err);
    }
};