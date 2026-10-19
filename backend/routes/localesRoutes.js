// backend/routes/localesRoutes.js
const express = require('express');
const localesController = require('../controllers/localesController');
const { validateUuidParam } = require('../middleware/validateUuid');
const { requirePermiso, resolveLocalScope, ownsLocalParam } = require('../middleware/auth');
const router = express.Router();

router.param('id', validateUuidParam);

router.get('/', requirePermiso('locales.ver'), resolveLocalScope, localesController.getAllLocales);
router.get('/:id', requirePermiso('locales.ver'), ownsLocalParam, localesController.getLocaleById);
router.post('/', requirePermiso('locales.administrar'), localesController.createLocale);
router.delete('/:id', requirePermiso('locales.administrar'), localesController.deleteLocale);

module.exports = router;
