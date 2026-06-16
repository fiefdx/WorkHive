const express = require('express');
const router = express.Router();
const { getUserById, updateUser, deleteUser } = require('../controllers/users');
const { protect } = require('../middleware/auth');

router.get('/:id', getUserById);
router.put('/:id', protect, updateUser);
router.delete('/:id', protect, deleteUser);

module.exports = router;
