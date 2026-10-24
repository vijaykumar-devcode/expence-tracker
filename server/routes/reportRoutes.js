const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const controller = require('../controllers/reportController');
const router = express.Router();
router.use(protect);
router.get('/', controller.getReport);
router.get('/csv', controller.exportCsv);
module.exports = router;
