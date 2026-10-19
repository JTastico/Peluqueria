// backend/routes/configuracionRoutes.js
const express = require('express');
const configuracionController = require('../controllers/configuracionController');
const marcaController = require('../controllers/marcaController');
const { requirePermiso } = require('../middleware/auth');
const router = express.Router();

router.get('/', requirePermiso('configuracion.ver'), configuracionController.getConfiguracion);
router.put('/', requirePermiso('configuracion.administrar'), configuracionController.updateConfiguracion);
router.put('/tema', requirePermiso('configuracion.administrar'), marcaController.guardarTema);
router.put('/logo', requirePermiso('configuracion.administrar'), marcaController.guardarLogo);
router.delete('/logo', requirePermiso('configuracion.administrar'), marcaController.eliminarLogo);

module.exports = router;
