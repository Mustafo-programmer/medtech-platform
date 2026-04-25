const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issueController');
const { protect, allow } = require('../middleware/auth');

router.get('/',       protect,                          issueController.getAll);
router.post('/',      protect, allow('admin', 'editor'), issueController.create);
router.patch('/:id',  protect, allow('admin', 'editor'), issueController.update);
router.delete('/:id', protect, allow('admin'),           issueController.delete);

module.exports = router;