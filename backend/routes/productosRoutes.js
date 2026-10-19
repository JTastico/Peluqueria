// backend/routes/productosRoutes.js
const express = require('express');
const productosController = require('../controllers/productosController');
const { validateUuidParam } = require('../middleware/validateUuid');
const { requirePermiso, resolveLocalScope, enforceBodyLocal, ownsRecord } = require('../middleware/auth');
const router = express.Router();

router.param('id', validateUuidParam);
router.use(requirePermiso('inventario.administrar'));

router.get('/', resolveLocalScope, productosController.getProductos);
router.post('/', enforceBodyLocal, productosController.createProducto);
router.put('/:id', ownsRecord('productos'), productosController.updateProducto);
router.patch('/:id/stock', ownsRecord('productos'), productosController.ajustarStock);
router.delete('/:id', ownsRecord('productos'), productosController.deleteProducto);

module.exports = router;
