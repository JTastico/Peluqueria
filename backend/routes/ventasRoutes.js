// backend/routes/ventasRoutes.js
const express = require('express');
const ventasController = require('../controllers/ventasController');
const { validateUuidParam } = require('../middleware/validateUuid');
const { requirePermiso, resolveLocalScope, enforceBodyLocal, ownsRecord } = require('../middleware/auth');
const router = express.Router();

router.param('id', validateUuidParam);

router.get('/', requirePermiso('ventas.ver_local', 'ventas.registrar'), resolveLocalScope, ventasController.listarVentas);
router.post('/', requirePermiso('ventas.registrar'), enforceBodyLocal, ventasController.crearVenta);
router.patch('/:id/anular', requirePermiso('ventas.anular'), ownsRecord('ventas'), ventasController.anularVenta);

module.exports = router;
