const express = require('express');
const router = express.Router();
const {
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    addTaskComment,
    deleteTaskComment,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.route('/')
    .get(protect, getTasks)
    .post(protect, createTask);

router.route('/:id')
    .put(protect, updateTask)
    .delete(protect, deleteTask);

router.route('/:id/comments').post(protect, addTaskComment);
router.route('/:taskId/comments/:commentId').delete(protect, deleteTaskComment);

module.exports = router;
