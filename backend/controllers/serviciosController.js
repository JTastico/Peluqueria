// backend/controllers/serviciosController.js
const { getDb } = require('../db');

// Obtener todos los servicios (opcionalmente filtrados por local_id)
exports.getAllServicios = async (req, res, next) => {
    const { local_id } = req.query; // Obtener local_id de los query params (ej. ?local_id=1)
    try {
        const pool = getDb();
        let query = 'SELECT id, nombre, categoria, precio, duracion, descripcion, local_id FROM servicios'; // Seleccionar solo columnas existentes
        const params = [];

        if (local_id) {
            query += ' WHERE local_id = ?';
            params.push(local_id);
        }

        const [rows] = await pool.query(query, params);
        const servicios = rows.map(row => ({
            ...row,
            precio: parseFloat(row.precio) // Convertir solo precio
            // popularidad, ingresosMes, clientesMes ya no se procesan aquí
        }));
        res.json(servicios);
    } catch (err) {
        next(err);
    }
};

// Crear un nuevo servicio
exports.createServicio = async (req, res, next) => {
    // CAMBIO CLAVE AQUÍ: Quitar popularidad, ingresosMes, clientesMes del body
    const { nombre, categoria, precio, duracion, descripcion, local_id } = req.body;

    if (!nombre || !categoria || !precio || !local_id) {
        return res.status(400).json({ message: 'Nombre, categoría, precio y ID del local son obligatorios para el servicio.' });
    }

    try {
        const pool = getDb();
        const [result] = await pool.query(
            // CAMBIO CLAVE AQUÍ: Las columnas deben coincidir con la tabla (sin popularidad, ingresosMes, clientesMes)
            `INSERT INTO servicios (nombre, categoria, precio, duracion, descripcion, local_id)
             VALUES (?, ?, ?, ?, ?, ?)`, // ¡AHORA SON 6 QUESTION MARKS!
            [
                nombre,
                categoria,
                precio,
                duracion || null,
                descripcion || null,
                local_id
            ]
        );

        const newServicioId = result.insertId;
        const [newServicioRows] = await pool.query('SELECT * FROM servicios WHERE id = ?', [newServicioId]);
        const newServicio = {
            ...newServicioRows[0],
            precio: parseFloat(newServicioRows[0].precio)
            // popularidad, ingresosMes, clientesMes ya no se procesan aquí
        };
        res.status(201).json(newServicio);

    } catch (err) {
        next(err);
    }
};

// Eliminar un servicio (sin cambios)
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

// Obtener servicio por ID si es necesario (sin cambios en funcionalidad, solo columnas seleccionadas)
exports.getServicioById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const pool = getDb();
        // Seleccionar solo columnas existentes
        const [rows] = await pool.query('SELECT id, nombre, categoria, precio, duracion, descripcion, local_id FROM servicios WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Servicio no encontrado.' });
        }
        const servicio = {
            ...rows[0],
            precio: parseFloat(rows[0].precio)
            // popularidad, ingresosMes, clientesMes ya no se procesan aquí
        };
        res.json(servicio);
    } catch (err) {
        next(err);
    }
};