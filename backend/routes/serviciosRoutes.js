// backend/routes/serviciosRoutes.js
const express = require('express');
const serviciosController = require('../controllers/serviciosController');
const { validateUuidParam } = require('../middleware/validateUuid');
const { requirePermiso, resolveLocalScope, ownsRecord } = require('../middleware/auth');
const router = express.Router();

router.param('id', validateUuidParam);

// Quien cobra necesita ver los servicios y sus precios
router.get('/', requirePermiso('servicios.ver', 'servicios.administrar'), resolveLocalScope, serviciosController.getAllServicios);
router.post('/', requirePermiso('servicios.administrar'), serviciosController.createServicio);
router.put('/:id', requirePermiso('servicios.administrar'), ownsRecord('servicios'), serviciosController.updateServicio);
router.delete('/:id', requirePermiso('servicios.administrar'), ownsRecord('servicios'), serviciosController.deleteServicio);

module.exports = router;
