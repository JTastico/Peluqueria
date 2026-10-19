// backend/routes/rolesRoutes.js
const express = require('express');
const rolesController = require('../controllers/rolesController');
const { requirePermiso } = require('../middleware/auth');
const router = express.Router();

router.param('id', (req, res, next, value) => {
    if (!/^[a-z0-9_]{1,40}$/.test(value)) return res.status(400).json({ message: 'Identificador de rol inválido.' });
    next();
});
router.use(requirePermiso('usuarios.administrar'));

router.get('/', rolesController.getRoles);
router.post('/', rolesController.crearRol);
router.put('/:id', rolesController.actualizarRol);
router.delete('/:id', rolesController.eliminarRol);

module.exports = router;
