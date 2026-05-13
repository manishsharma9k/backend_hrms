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
        const { status } = req.body;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const existingAttendance = await Attendance.findOne({
            employee: req.user.id,
            date: { $gte: today }
        });
        if (existingAttendance) {
            return res.status(400).json({ success: false, error: 'Attendance already marked for today' });
        }
        const now = new Date();
        const attendance = await Attendance.create({
            employee: req.user.id,
            status,
            date: now,
            checkIn: now
        });
        res.status(201).json({ success: true, data: attendance });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Check out
// @route   PUT /api/employee/attendance/checkout
// @access  Private/Employee
exports.checkOut = async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const attendance = await Attendance.findOne({
            employee: req.user.id,
            date: { $gte: today }
        });
        if (!attendance) return res.status(404).json({ success: false, error: 'No attendance found for today' });
        if (attendance.checkOut) return res.status(400).json({ success: false, error: 'Already checked out' });
        attendance.checkOut = new Date();
        await attendance.save();
        res.status(200).json({ success: true, data: attendance });
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
        const user = await User.findById(req.user.id).select('salary name email department').populate('department', 'name');
        const attendance = await Attendance.find({ employee: req.user.id });
        const presentDays = attendance.filter(a => a.status === 'Present').length;
        const absentDays = attendance.filter(a => a.status === 'Absent').length;
        const leaveDays = attendance.filter(a => a.status === 'On Leave').length;
        res.status(200).json({ success: true, data: { salary: user.salary, name: user.name, email: user.email, department: user.department, presentDays, absentDays, leaveDays, totalDays: attendance.length } });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
