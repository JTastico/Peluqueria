// backend/controllers/serviciosController.js
const { getDb } = require('../db');

// Obtener todos los servicios (opcionalmente filtrados por local_id)
exports.getAllServicios = async (req, res, next) => {
    const { local_id } = req.query; // Obtener local_id de los query params (ej. ?local_id=1)
    try {
        const pool = getDb();
        let query = 'SELECT * FROM servicios';
        const params = [];

        if (local_id) {
            query += ' WHERE local_id = ?';
            params.push(local_id);
        }

        const [rows] = await pool.query(query, params);
        const servicios = rows.map(row => ({
            ...row,
            precio: parseFloat(row.precio),
            popularidad: parseInt(row.popularidad, 10),
            ingresosMes: parseFloat(row.ingresosMes),
            clientesMes: parseInt(row.clientesMes, 10)
        }));
        res.json(servicios);
    } catch (err) {
        next(err);
    }
};

// Crear un nuevo servicio
exports.createServicio = async (req, res, next) => {
    const { nombre, categoria, precio, duracion, popularidad, ingresosMes, clientesMes, descripcion, local_id } = req.body;

    if (!nombre || !categoria || !precio || !local_id) {
        return res.status(400).json({ message: 'Nombre, categoría, precio y ID del local son obligatorios para el servicio.' });
    }

    try {
        const pool = getDb();
        const [result] = await pool.query(
            `INSERT INTO servicios (nombre, categoria, precio, duracion, popularidad, ingresosMes, clientesMes, descripcion, local_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nombre,
                categoria,
                precio, // Se espera como número del frontend
                duracion || null,
                popularidad || 0,
                ingresosMes || 0,
                clientesMes || 0,
                descripcion || null,
                local_id
            ]
        );

        const newServicioId = result.insertId;
        const [newServicioRows] = await pool.query('SELECT * FROM servicios WHERE id = ?', [newServicioId]);
        const newServicio = {
            ...newServicioRows[0],
            precio: parseFloat(newServicioRows[0].precio),
            popularidad: parseInt(newServicioRows[0].popularidad, 10),
            ingresosMes: parseFloat(newServicioRows[0].ingresosMes),
            clientesMes: parseInt(newServicioRows[0].clientesMes, 10)
        };
        res.status(201).json(newServicio);

    } catch (err) {
        next(err);
    }
};

// Eliminar un servicio
exports.deleteServicio = async (req, res, next) => {
    const { id } = req.params;
    try {
        const pool = getDb();
        const [result] = await pool.query('DELETE FROM servicios WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Servicio no encontrado para eliminar.' });
        }
        res.status(200).json({ message: 'Servicio eliminado exitosamente.' });

    } catch (err) {
        next(err);
    }
};

// (Opcional) Obtener servicio por ID si es necesario
exports.getServicioById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const pool = getDb();
        const [rows] = await pool.query('SELECT * FROM servicios WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Servicio no encontrado.' });
        }
        const servicio = {
            ...rows[0],
            precio: parseFloat(rows[0].precio),
            popularidad: parseInt(rows[0].popularidad, 10),
            ingresosMes: parseFloat(rows[0].ingresosMes),
            clientesMes: parseInt(rows[0].clientesMes, 10)
        };
        res.json(servicio);
    } catch (err) {
        next(err);
    }
};