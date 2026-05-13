const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const protectRoute = require('../middleware/protectRoute');
const { imageUpload } = require('../middleware/upload');

/**
 * UPLOAD ROUTES
 * All routes are protected by JWT middleware.
 */
router.post('/image', protectRoute, imageUpload, uploadController.uploadImage);

module.exports = router;
