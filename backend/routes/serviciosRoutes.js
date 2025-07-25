// backend/routes/serviciosRoutes.js
const express = require('express');
const serviciosController = require('../controllers/serviciosController');
const router = express.Router();

router.get('/', serviciosController.getAllServicios);
router.post('/', serviciosController.createServicio);
router.delete('/:id', serviciosController.deleteServicio);
router.get('/:id', serviciosController.getServicioById); // Ruta para obtener por ID

module.exports = router;