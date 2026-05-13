const express = require('express');
const {
    applyLeave,
    getMyLeaves,
    markAttendance,
    checkOut,
    getMyAttendance,
    getSalaryDetails
} = require('../controllers/employeeController');

const { protect, authorize } = require('../middleware/authMiddleware');
const Holiday = require('../models/holidayModel');

const router = express.Router();

router.use(protect);
router.use(authorize('employee'));

router.route('/leave').post(applyLeave).get(getMyLeaves);
router.route('/attendance').post(markAttendance).get(getMyAttendance);
router.route('/attendance/checkout').put(checkOut);
router.route('/salary').get(getSalaryDetails);
router.get('/holidays', async (req, res) => {
    try {
        const holidays = await Holiday.find({ status: 'Approved' }).sort('date');
        res.status(200).json({ success: true, data: holidays });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

module.exports = router;
