const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, allow } = require('../middleware/auth');

router.post('/login',           authController.login);
router.post('/register',        protect, allow('admin'), authController.register);
router.get('/me',               protect, authController.getMe);
router.get('/users',            protect, allow('admin'), authController.getUsers);
router.patch('/users/:id/role', protect, allow('admin'), authController.updateRole);
router.delete('/users/:id',     protect, allow('admin'), authController.deleteUser);

module.exports = router;