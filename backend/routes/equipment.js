const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const { protect, allow } = require('../middleware/auth');
const log = require('../middleware/logger');

router.get('/', protect, equipmentController.getAll);
router.get('/:id', protect, equipmentController.getOne);
router.get('/:id/history', protect, equipmentController.getHistory);

router.post('/', protect, allow('admin','editor'), log('CREATE','equipment'), equipmentController.create);
router.put('/:id', protect, allow('admin','editor'), log('UPDATE','equipment'), equipmentController.update);
router.delete('/:id', protect, allow('admin'), log('DELETE','equipment'), equipmentController.delete);

module.exports = router;