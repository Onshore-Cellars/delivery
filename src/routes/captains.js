const express = require('express');
const router = express.Router();
const CaptainController = require('../controllers/CaptainController');

router.get('/', CaptainController.getAll);
router.get('/:id', CaptainController.getById);
router.post('/', CaptainController.create);
router.put('/:id', CaptainController.update);
router.delete('/:id', CaptainController.delete);

module.exports = router;
