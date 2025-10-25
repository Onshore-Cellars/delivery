const express = require('express');
const router = express.Router();
const DeliveryController = require('../controllers/DeliveryController');

router.get('/', DeliveryController.getAll);
router.get('/:id', DeliveryController.getById);
router.post('/', DeliveryController.create);
router.put('/:id', DeliveryController.update);
router.delete('/:id', DeliveryController.delete);

module.exports = router;
