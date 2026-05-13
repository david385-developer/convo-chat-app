const express = require('express');
const router = express.Router();
const protectRoute = require('../middleware/protectRoute');
const searchController = require('../controllers/searchController');

router.get('/', protectRoute, searchController.searchAll);

module.exports = router;
