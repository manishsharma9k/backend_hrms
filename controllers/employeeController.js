const Leave = require('../models/leaveModel');
const Attendance = require('../models/attendanceModel');
const Notification = require('../models/notificationModel');
const User = require('../models/userModel');

// @desc    Apply for leave
// @route   POST /api/employee/leave
// @access  Private/Employee
exports.applyLeave = async (req, res, next) => {
    try {
        const { startDate, endDate, reason } = req.body;
        
        const leave = await Leave.create({
            employee: req.user.id,
            startDate,
            endDate,
            reason
        });

        // Notify Admins
        const admins = await User.find({ role: 'admin' });
        const notifications = admins.map(admin => ({
            userId: admin._id,
            message: `New leave request from ${req.user.name}`,
            type: 'Leave',
            link: '/admin/leaves'
        }));
        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        res.status(201).json({ success: true, data: leave });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Get my leave requests
// @route   GET /api/employee/leave
// @access  Private/Employee
exports.getMyLeaves = async (req, res, next) => {
    try {
        const leaves = await Leave.find({ employee: req.user.id });
        res.status(200).json({ success: true, count: leaves.length, data: leaves });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Mark attendance
// @route   POST /api/employee/attendance
// @access  Private/Employee
exports.markAttendance = async (req, res, next) => {
    try {
        const { status } = req.body; // Present, Absent, On Leave
        
        // Basic implementation: prevent marking attendance twice in one day
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const existingAttendance = await Attendance.findOne({
            employee: req.user.id,
            date: { $gte: today }
        });

        if (existingAttendance) {
            return res.status(400).json({ success: false, error: 'Attendance already marked for today' });
        }

        const attendance = await Attendance.create({
            employee: req.user.id,
            status,
            date: new Date()
        });

        res.status(201).json({ success: true, data: attendance });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Get my attendance
// @route   GET /api/employee/attendance
// @access  Private/Employee
exports.getMyAttendance = async (req, res, next) => {
    try {
        const attendance = await Attendance.find({ employee: req.user.id }).sort('-date');
        res.status(200).json({ success: true, count: attendance.length, data: attendance });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Get salary details
// @route   GET /api/employee/salary
// @access  Private/Employee
exports.getSalaryDetails = async (req, res, next) => {
    try {
        // Salary is stored on the User model
        const user = await User.findById(req.user.id).select('salary');
        res.status(200).json({ success: true, data: { salary: user.salary } });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
