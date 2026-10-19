// backend/routes/marcaRoutes.js  (público: tema y logo se necesitan también en el login)
const express = require('express');
const marcaController = require('../controllers/marcaController');
const router = express.Router();

router.get('/', marcaController.getMarca);
router.get('/logo', marcaController.getLogo);

module.exports = router;
