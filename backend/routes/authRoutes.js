// backend/routes/authRoutes.js
const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.post('/login', authController.login);
router.get('/me', authenticate, authController.me);
router.post('/cambiar-password', authenticate, authController.cambiarPassword);
router.put('/preferencias', authenticate, authController.guardarPreferencias);

module.exports = router;
