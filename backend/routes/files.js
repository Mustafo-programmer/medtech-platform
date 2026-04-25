const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { protect, allow } = require('../middleware/auth');

router.get('/',      protect,                          fileController.getAll);
router.post('/',     protect, allow('admin', 'editor'), fileController.create);
router.delete('/:id', protect, allow('admin', 'editor'), fileController.delete);

module.exports = router;