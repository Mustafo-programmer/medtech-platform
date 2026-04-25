const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

router.get('/',       protect, commentController.getAll);
router.post('/',      protect, commentController.create);
router.delete('/:id', protect, commentController.delete);

module.exports = router;