const express = require('express');
const router = express.Router();
const previewController = require('../controllers/previewController');
const protectRoute = require('../middleware/protectRoute');

router.get('/', protectRoute, previewController.getPreview);

module.exports = router;
