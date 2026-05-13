const express = require('express');
const { register, login, getMe, logout, getPublicDepartments, registerAdmin, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const Holiday = require('../models/holidayModel');
const User = require('../models/userModel');

const router = express.Router();

router.post('/register', register);
router.post('/admin/register', registerAdmin);
router.post('/login', login);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.get('/departments', getPublicDepartments);
router.get('/holidays', protect, async (req, res) => {
    try {
        const holidays = await Holiday.find().sort('date');
        res.status(200).json({ success: true, data: holidays });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);
router.put('/updateprofile', protect, async (req, res) => {
    try {
        const { photo, phone, designation, name } = req.body;
        const updated = await User.findByIdAndUpdate(
            req.user.id,
            { photo, phone, designation, name },
            { new: true, runValidators: true }
        ).populate('department', 'name');
        res.status(200).json({ success: true, data: updated });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

router.put('/changepassword', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id).select('+password');
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) return res.status(400).json({ success: false, error: 'Current password is incorrect' });
        user.password = newPassword;
        await user.save();
        res.status(200).json({ success: true, data: 'Password updated successfully' });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

module.exports = router;
