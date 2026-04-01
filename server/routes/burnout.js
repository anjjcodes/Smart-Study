const express = require('express');
const router = express.Router();
const { getBurnoutStatus } = require('../controllers/burnoutController');
const auth = require('../middleware/auth');

router.get('/', auth, getBurnoutStatus);

module.exports = router;
