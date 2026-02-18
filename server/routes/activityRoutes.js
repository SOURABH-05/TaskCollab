const express = require('express');
const router = express.Router();
const {
    getTaskActivity,
    getBoardActivity,
} = require('../controllers/activityController');
const { protect } = require('../middleware/auth');

router.get('/:taskId', protect, getTaskActivity);
router.get('/board/:boardId', protect, getBoardActivity);

module.exports = router;
