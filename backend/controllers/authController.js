// backend/controllers/authController.js
const { getDb } = require('../db');

exports.login = async (req, res, next) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Nombre de usuario y contraseña son requeridos.' });
    }

    try {
        const pool = getDb();
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        const user = rows[0];
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
        next(err); // Pasa el error al middleware de manejo de errores
    }
};