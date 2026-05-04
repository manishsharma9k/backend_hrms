const express = require('express');
const { register, login, getMe, logout, getPublicDepartments, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.get('/departments', getPublicDepartments);
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);

module.exports = router;
