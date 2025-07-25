// backend/routes/localesRoutes.js
const express = require('express');
const localesController = require('../controllers/localesController');
const router = express.Router();

router.get('/', localesController.getAllLocales);
router.get('/:id', localesController.getLocaleById);
router.post('/', localesController.createLocale);
router.delete('/:id', localesController.deleteLocale);

module.exports = router;