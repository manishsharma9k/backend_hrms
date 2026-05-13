const express = require('express');
const {
    getEmployees, addEmployee, updateEmployee, deleteEmployee,
    getDepartments, addDepartment, updateDepartment, deleteDepartment,
    getAllLeaves, updateLeaveStatus,
    getHolidays, addHoliday, deleteHoliday, updateHolidayStatus,
    getDashboardStats, getEmployeeProfile,
    getCandidates, addCandidate, candidateAction, deleteCandidate
} = require('../controllers/adminController');
const { sendOfferLetter } = require('../controllers/offerLetterController');

const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);
router.use(authorize('admin', 'hr'));

router.route('/stats').get(getDashboardStats);
router.route('/attendance').get(async (req, res) => {
    try {
        const Attendance = require('../models/attendanceModel');
        const today = new Date(); today.setHours(0,0,0,0);
        const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
        const records = await Attendance.find({ date: { $gte: today, $lt: tomorrow } }).populate('employee','name photo');
        res.status(200).json({ success: true, data: records });
    } catch(err) { res.status(400).json({ success: false, error: err.message }); }
});

router.route('/employees').get(getEmployees).post(addEmployee);
router.route('/employees/:id').put(updateEmployee).delete(deleteEmployee);
router.route('/employees/:id/profile').get(getEmployeeProfile);

router.route('/departments').get(getDepartments).post(addDepartment);
router.route('/departments/:id').put(updateDepartment).delete(deleteDepartment);

router.route('/leaves').get(getAllLeaves);
router.route('/leaves/:id').put(updateLeaveStatus);

router.route('/holidays').get(getHolidays).post(addHoliday);
router.route('/holidays/:id').put(updateHolidayStatus).delete(deleteHoliday);

router.route('/offer-letter').post(sendOfferLetter);

router.route('/recruitment').get(getCandidates).post(addCandidate);
router.route('/recruitment/:id/action').put(candidateAction);
router.route('/recruitment/:id').delete(deleteCandidate);
// HR-only: restrict non-admin from destructive admin routes
// (all recruitment routes above are accessible to both admin and hr)

module.exports = router;
