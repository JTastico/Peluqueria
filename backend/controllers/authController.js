// backend/controllers/authController.js
const { getDB } = require('../db');
// Removido: const bcrypt = require('bcrypt'); // Ya no es necesario para comparación en texto plano

exports.login = async (req, res, next) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Nombre de usuario y contraseña son requeridos.' });
    }

    try {
        const connection = getDB(); 
        
        // Buscar al usuario por nombre de usuario Y contraseña (texto plano)
        const [rows] = await connection.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);

        if (rows.length === 0) {
            // No se encontró el usuario con esa combinación de credenciales
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        const user = rows[0]; // Si llegamos aquí, se encontró un usuario con credenciales válidas
        
        res.json({
            message: 'Login exitoso',
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                local_id: user.local_id
            }
        });
    } catch (err) {
        console.error('Error en el login:', err); // Log del error para depuración
        next(err); // Pasa el error al middleware de manejo de errores
    }
};