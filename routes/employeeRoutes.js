const express = require('express');
const {
    applyLeave,
    getMyLeaves,
    markAttendance,
    getMyAttendance,
    getSalaryDetails
} = require('../controllers/employeeController');

const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes here are protected and restricted to employee
router.use(protect);
router.use(authorize('employee'));

router.route('/leave')
    .post(applyLeave)
    .get(getMyLeaves);

router.route('/attendance')
    .post(markAttendance)
    .get(getMyAttendance);

router.route('/salary')
    .get(getSalaryDetails);

module.exports = router;
