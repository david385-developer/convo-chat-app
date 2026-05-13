const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const protectRoute = require('../middleware/protectRoute');
const validateInput = require('../middleware/validateInput');
const { avatarUpload } = require('../middleware/upload');

router.post('/register', avatarUpload, validateInput.registerRules, validateInput.validate, authController.register);
router.post('/login', validateInput.loginRules, validateInput.validate, authController.login);
router.post('/logout', protectRoute, authController.logout);
router.get('/me', protectRoute, authController.getMe);

module.exports = router;
