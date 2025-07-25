// backend/controllers/trabajadoresController.js
const { getDB } = require('../db'); // CORRECCIÓN: Cambiado de getDb a getDB (D mayúscula)

exports.getAllTrabajadores = async (req, res, next) => {
    try {
        const pool = getDB(); // CORRECCIÓN: Usar getDB (D mayúscula)
        // CORRECCIÓN: Nombres de columnas ajustados a la DB y alias para compatibilidad con frontend
        const [rows] = await pool.query('SELECT id, nombre, apellido, edad, dni, telefono, nacionalidad, estado_civil, fecha_ingreso, nivel_estudios, experiencia, cantidad_hijos, especialidad, valoracion AS rating, clientes_atendidos AS clientesAtendidos, ingreso_mensual AS ingresosMes, foto, servicios, local_id, salario FROM trabajadores');
        const trabajadores = rows.map(row => ({
            ...row,
            edad: parseInt(row.edad, 10),
            experiencia: parseInt(row.experiencia, 10),
            cantidad_hijos: parseInt(row.cantidad_hijos, 10),
            rating: parseFloat(row.rating), // Ya viene como 'rating' por el alias
            clientesAtendidos: parseInt(row.clientesAtendidos, 10), // Ya viene como 'clientesAtendidos' por el alias
            ingresosMes: parseFloat(row.ingresosMes), // Ya viene como 'ingresosMes' por el alias
            servicios: JSON.parse(row.servicios),
            fecha_ingreso: row.fecha_ingreso ? new Date(row.fecha_ingreso).toISOString().split('T')[0] : null
        }));
        res.json(trabajadores);
    } catch (err) {
        console.error('Error al obtener trabajadores:', err); // Log para depuración
        next(err);
    }
};

exports.createTrabajador = async (req, res, next) => {
    const { nombre, apellido, edad, dni, telefono, nacionalidad, estado_civil, fecha_ingreso, nivel_estudios, experiencia, cantidad_hijos, especialidad, rating, clientesAtendidos, ingresosMes, foto, servicios, local_id, salario } = req.body; // Añadido salario al destructuring

    if (!nombre || !apellido || !especialidad || !local_id || !dni || !fecha_ingreso) {
        return res.status(400).json({ message: 'Nombre, apellido, especialidad, DNI, fecha de ingreso y ID del local son obligatorios para el trabajador.' });
    }

    try {
        const pool = getDB(); // CORRECCIÓN: Usar getDB (D mayúscula)
        // CORRECCIÓN: Nombres de columnas ajustados a la DB para INSERT
        const [result] = await pool.query(
            `INSERT INTO trabajadores (nombre, apellido, edad, dni, telefono, nacionalidad, estado_civil, fecha_ingreso, nivel_estudios, experiencia, cantidad_hijos, especialidad, valoracion, clientes_atendidos, ingreso_mensual, foto, servicios, local_id, salario)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
                rating || 0, // Mapeado a 'valoracion'
                clientesAtendidos || 0, // Mapeado a 'clientes_atendidos'
                ingresosMes || 0, // Mapeado a 'ingreso_mensual'
                foto || null,
                JSON.stringify(servicios || []),
                local_id,
                salario || 0 // Asegurar que salario se inserta
            ]
        );

        const newTrabajadorId = result.insertId;
        // Recuperar el trabajador completo para devolverlo, usando alias para compatibilidad frontend
        const [newTrabajadorRows] = await pool.query('SELECT id, nombre, apellido, edad, dni, telefono, nacionalidad, estado_civil, fecha_ingreso, nivel_estudios, experiencia, cantidad_hijos, especialidad, valoracion AS rating, clientes_atendidos AS clientesAtendidos, ingreso_mensual AS ingresosMes, foto, servicios, local_id, salario FROM trabajadores WHERE id = ?', [newTrabajadorId]);
        
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
        console.error('Error al crear trabajador:', err); // Log para depuración
        next(err);
    }
};

exports.deleteTrabajador = async (req, res, next) => {
    const { id } = req.params;
    try {
        const pool = getDB(); // CORRECCIÓN: Usar getDB (D mayúscula)
        const [result] = await pool.query('DELETE FROM trabajadores WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Trabajador no encontrado para eliminar.' });
        }
        res.status(200).json({ message: 'Trabajador eliminado exitosamente.' });

    } catch (err) {
        console.error('Error al eliminar trabajador:', err); // Log para depuración
        next(err);
    }
};