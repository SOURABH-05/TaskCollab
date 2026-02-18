const express = require('express');
const router = express.Router();
const {
    createList,
    updateList,
    deleteList,
} = require('../controllers/listController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createList);
router.put('/:id', protect, updateList);
router.delete('/:id', protect, deleteList);

module.exports = router;
