// backend/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
    console.error(err.stack); // El detalle queda solo en el log del servidor

    // Violación de unicidad (usuario o DNI repetido)
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, message: 'Ya existe un registro con esos datos (usuario o DNI repetido).' });
    }
    // JSON mal formado
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ success: false, message: 'El cuerpo de la petición no es JSON válido.' });
    }

    const statusCode = err.statusCode || err.status || 500;
    const dev = process.env.NODE_ENV === 'development';
    res.status(statusCode).json({
        success: false,
        // En producción no se filtran detalles internos de errores 5xx
        message: statusCode < 500 || dev ? (err.message || 'Error') : 'Error interno del servidor',
        ...(dev && { stack: err.stack })
    });
};

module.exports = errorHandler;
