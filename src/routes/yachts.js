const express = require('express');
const router = express.Router();
const YachtController = require('../controllers/YachtController');

router.get('/', YachtController.getAll);
router.get('/:id', YachtController.getById);
router.post('/', YachtController.create);
router.put('/:id', YachtController.update);
router.delete('/:id', YachtController.delete);

module.exports = router;
