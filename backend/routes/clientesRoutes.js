// backend/routes/clientesRoutes.js
const express = require('express');
const clientesController = require('../controllers/clientesController'); // Asegúrate de que esta ruta sea correcta
const router = express.Router();

router.post('/', clientesController.createClienteCita);
router.get('/', clientesController.getAllClientes);
router.delete('/:id', clientesController.deleteCliente);

module.exports = router;