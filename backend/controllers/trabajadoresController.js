// backend/controllers/trabajadoresController.js
const { getDb } = require('../db');

exports.getAllTrabajadores = async (req, res, next) => {
    try {
        const pool = getDb();
        const [rows] = await pool.query('SELECT id, nombre, apellido, edad, dni, telefono, nacionalidad, estado_civil, fecha_ingreso, nivel_estudios, experiencia, cantidad_hijos, especialidad, rating, clientesAtendidos, ingresosMes, foto, servicios, local_id FROM trabajadores');
        const trabajadores = rows.map(row => ({
            ...row,
            edad: parseInt(row.edad, 10),
            experiencia: parseInt(row.experiencia, 10),
            cantidad_hijos: parseInt(row.cantidad_hijos, 10),
            rating: parseFloat(row.rating),
            clientesAtendidos: parseInt(row.clientesAtendidos, 10),
            ingresosMes: parseFloat(row.ingresosMes),
            servicios: JSON.parse(row.servicios),
            fecha_ingreso: row.fecha_ingreso ? new Date(row.fecha_ingreso).toISOString().split('T')[0] : null
        }));
        res.json(trabajadores);
    } catch (err) {
        next(err);
    }
};

exports.createTrabajador = async (req, res, next) => {
    const { nombre, apellido, edad, dni, telefono, nacionalidad, estado_civil, fecha_ingreso, nivel_estudios, experiencia, cantidad_hijos, especialidad, rating, clientesAtendidos, ingresosMes, foto, servicios, local_id } = req.body;

    if (!nombre || !apellido || !especialidad || !local_id || !dni || !fecha_ingreso) {
        return res.status(400).json({ message: 'Nombre, apellido, especialidad, DNI, fecha de ingreso y ID del local son obligatorios para el trabajador.' });
    }

    try {
        const pool = getDb();
        const [result] = await pool.query(
            `INSERT INTO trabajadores (nombre, apellido, edad, dni, telefono, nacionalidad, estado_civil, fecha_ingreso, nivel_estudios, experiencia, cantidad_hijos, especialidad, rating, clientesAtendidos, ingresosMes, foto, servicios, local_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nombre,
                apellido,
                edad || null,
                dni,
                telefono || null,
                nacionalidad || null,
                estado_civil || null,
                fecha_ingreso,
                nivel_estudios || null,
                experiencia || 0,
                cantidad_hijos || 0,
                especialidad,
                rating || 0,
                clientesAtendidos || 0,
                ingresosMes || 0,
                foto || null,
                JSON.stringify(servicios || []),
                local_id
            ]
        );

        const newTrabajadorId = result.insertId;
        const [newTrabajadorRows] = await pool.query('SELECT * FROM trabajadores WHERE id = ?', [newTrabajadorId]);
        const newTrabajador = {
            ...newTrabajadorRows[0],
            edad: parseInt(newTrabajadorRows[0].edad, 10),
            experiencia: parseInt(newTrabajadorRows[0].experiencia, 10),
            cantidad_hijos: parseInt(newTrabajadorRows[0].cantidad_hijos, 10),
            rating: parseFloat(newTrabajadorRows[0].rating),
            clientesAtendidos: parseInt(newTrabajadorRows[0].clientesAtendidos, 10),
            ingresosMes: parseFloat(newTrabajadorRows[0].ingresosMes),
            servicios: JSON.parse(newTrabajadorRows[0].servicios),
            fecha_ingreso: newTrabajadorRows[0].fecha_ingreso ? new Date(newTrabajadorRows[0].fecha_ingreso).toISOString().split('T')[0] : null
        };
        res.status(201).json(newTrabajador);

    } catch (err) {
        next(err);
    }
};

exports.deleteTrabajador = async (req, res, next) => {
    const { id } = req.params;
    try {
        const pool = getDb();
        const [result] = await pool.query('DELETE FROM trabajadores WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Trabajador no encontrado para eliminar.' });
        }
        res.status(200).json({ message: 'Trabajador eliminado exitosamente.' });

    } catch (err) {
        next(err);
    }
};