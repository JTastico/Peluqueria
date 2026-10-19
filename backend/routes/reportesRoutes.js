// backend/routes/reportesRoutes.js
const express = require('express');
const reportesController = require('../controllers/reportesController');
const { validateUuidParam } = require('../middleware/validateUuid');
const { requirePermiso, resolveLocalScope, ownsLocalParam } = require('../middleware/auth');
const router = express.Router();

router.param('id', validateUuidParam);

// Reportes generales (acotados a los locales del usuario)
router.get('/trabajadores', requirePermiso('reportes.global'), resolveLocalScope, reportesController.getLiquidacion);
router.get('/dashboard', requirePermiso('reportes.global'), resolveLocalScope, reportesController.getDashboard);
// Detalle de un local dentro del alcance del usuario
router.get('/local/:id', requirePermiso('reportes.local', 'reportes.global'), ownsLocalParam, reportesController.getLocalDetalle);

module.exports = router;
