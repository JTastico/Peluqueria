// backend/routes/usuariosRoutes.js
const express = require('express');
const usuariosController = require('../controllers/usuariosController');
const { validateUuidParam } = require('../middleware/validateUuid');
const { requirePermiso } = require('../middleware/auth');
const router = express.Router();

router.param('id', validateUuidParam);
router.use(requirePermiso('usuarios.administrar'));

router.get('/', usuariosController.getUsuarios);
router.put('/:id', usuariosController.actualizarUsuario);

module.exports = router;
