// backend/routes/trabajadoresRoutes.js
const express = require('express');
const trabajadoresController = require('../controllers/trabajadoresController');
const router = express.Router();

router.get('/', trabajadoresController.getAllTrabajadores);
router.post('/', trabajadoresController.createTrabajador);
router.delete('/:id', trabajadoresController.deleteTrabajador);

module.exports = router;