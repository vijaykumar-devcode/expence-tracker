const express = require('express');
const {
  register,
  login,
  logout,
  getCurrentUser,
  changePassword,
  updateUserProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, getCurrentUser);
router.post('/change-password', protect, changePassword);
router.put('/profile', protect, updateUserProfile);

module.exports = router;
