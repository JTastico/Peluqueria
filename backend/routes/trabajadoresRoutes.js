// backend/routes/trabajadoresRoutes.js
const express = require('express');
const trabajadoresController = require('../controllers/trabajadoresController');
const { validateUuidParam } = require('../middleware/validateUuid');
const { requirePermiso, resolveLocalScope, enforceBodyLocal, ownsRecord } = require('../middleware/auth');
const router = express.Router();

router.param('id', validateUuidParam);
router.param('local_id', validateUuidParam);

// Quien cobra necesita la lista de trabajadores para atribuirles los servicios
router.get('/', requirePermiso('trabajadores.ver'), resolveLocalScope, trabajadoresController.getAllTrabajadores);
router.post('/', requirePermiso('trabajadores.administrar'), enforceBodyLocal, trabajadoresController.createTrabajador);
router.delete('/:id', requirePermiso('trabajadores.administrar'), ownsRecord('trabajadores'), trabajadoresController.deleteTrabajador);
router.post('/:id/transferir', requirePermiso('trabajadores.transferir'), ownsRecord('trabajadores'), trabajadoresController.transferirTrabajador);
router.post('/:id/locales', requirePermiso('trabajadores.transferir'), ownsRecord('trabajadores'), trabajadoresController.agregarALocal);
router.patch('/:id/locales/:local_id', requirePermiso('trabajadores.transferir'), ownsRecord('trabajadores'), trabajadoresController.cambiarEstadoEnLocal);
router.get('/:id/historial', requirePermiso('trabajadores.ver'), trabajadoresController.historialTrabajador);

module.exports = router;
