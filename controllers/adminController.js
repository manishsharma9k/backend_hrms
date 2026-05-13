const User = require('../models/userModel');
const Department = require('../models/departmentModel');
const Leave = require('../models/leaveModel');
const Notification = require('../models/notificationModel');
const Holiday = require('../models/holidayModel');
const Attendance = require('../models/attendanceModel');
const Recruitment = require('../models/recruitmentModel');

// @desc    Get all employees
// @route   GET /api/admin/employees
// @access  Private/Admin
exports.getEmployees = async (req, res, next) => {
    try {
        const employees = await User.find({ role: 'employee' }).populate('department', 'name');
        res.status(200).json({ success: true, count: employees.length, data: employees });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Add new employee
// @route   POST /api/admin/employees
// @access  Private/Admin
exports.addEmployee = async (req, res, next) => {
    try {
        const { name, email, password, department, salary } = req.body;
        const employee = await User.create({
            name, email, password, role: 'employee', department, salary
        });
        res.status(201).json({ success: true, data: employee });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ success: false, error: 'An employee with this email already exists.' });
        }
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Update employee
// @route   PUT /api/admin/employees/:id
// @access  Private/Admin
exports.updateEmployee = async (req, res, next) => {
    try {
        let employee = await User.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({ success: false, error: 'Employee not found' });
        }
        
        // Prevent password update from this route directly
        if (req.body.password) {
            delete req.body.password;
        }

        employee = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        res.status(200).json({ success: true, data: employee });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Delete employee
// @route   DELETE /api/admin/employees/:id
// @access  Private/Admin
exports.deleteEmployee = async (req, res, next) => {
    try {
        const employee = await User.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({ success: false, error: 'Employee not found' });
        }
        await employee.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Get departments
// @route   GET /api/admin/departments
// @access  Private/Admin
exports.getDepartments = async (req, res, next) => {
    try {
        const departments = await Department.find();
        res.status(200).json({ success: true, count: departments.length, data: departments });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Add department
// @route   POST /api/admin/departments
// @access  Private/Admin
exports.addDepartment = async (req, res, next) => {
    try {
        const department = await Department.create(req.body);
        res.status(201).json({ success: true, data: department });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Update department
// @route   PUT /api/admin/departments/:id
// @access  Private/Admin
exports.updateDepartment = async (req, res, next) => {
    try {
        const department = await Department.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!department) {
            return res.status(404).json({ success: false, error: 'Department not found' });
        }
        res.status(200).json({ success: true, data: department });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Delete department
// @route   DELETE /api/admin/departments/:id
// @access  Private/Admin
exports.deleteDepartment = async (req, res, next) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({ success: false, error: 'Department not found' });
        }
        await department.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Get all leave requests
// @route   GET /api/admin/leaves
// @access  Private/Admin
exports.getAllLeaves = async (req, res, next) => {
    try {
        const leaves = await Leave.find().populate('employee', 'name email');
        res.status(200).json({ success: true, count: leaves.length, data: leaves });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Update leave status (Approve/Reject)
// @route   PUT /api/admin/leaves/:id
// @access  Private/Admin
exports.updateLeaveStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ success: false, error: 'Invalid status' });
        }

        const leave = await Leave.findByIdAndUpdate(req.params.id, { status }, {
            new: true,
            runValidators: true
        });

        if (!leave) {
            return res.status(404).json({ success: false, error: 'Leave request not found' });
        }

        // Notify Employee
        await Notification.create({
            userId: leave.employee,
            message: `Your leave request has been ${status}`,
            type: 'Leave',
            link: '/employee/leaves'
        });

        res.status(200).json({ success: true, data: leave });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Get single employee profile with attendance
// @route   GET /api/admin/employees/:id/profile
// @access  Private/Admin
exports.getEmployeeProfile = async (req, res, next) => {
    try {
        const employee = await User.findById(req.params.id).populate('department', 'name');
        if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' });
        const attendance = await Attendance.find({ employee: req.params.id }).sort('-date');
        const presentDays = attendance.filter(a => a.status === 'Present').length;
        const absentDays = attendance.filter(a => a.status === 'Absent').length;
        const leaveDays = attendance.filter(a => a.status === 'On Leave').length;
        const leaves = await Leave.find({ employee: req.params.id }).sort('-createdAt');
        res.status(200).json({ success: true, data: { employee, attendance, presentDays, absentDays, leaveDays, totalDays: attendance.length, leaves } });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Get holidays
// @route   GET /api/admin/holidays
// @access  Private/Admin
exports.getHolidays = async (req, res, next) => {
    try {
        const holidays = await Holiday.find().sort('date');
        res.status(200).json({ success: true, count: holidays.length, data: holidays });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Add holiday
// @route   POST /api/admin/holidays
// @access  Private/Admin
exports.addHoliday = async (req, res, next) => {
    try {
        const holiday = await Holiday.create({ ...req.body, status: 'Approved' });
        res.status(201).json({ success: true, data: holiday });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Update holiday status (Approve/Reject)
// @route   PUT /api/admin/holidays/:id
// @access  Private/Admin
exports.updateHolidayStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
            return res.status(400).json({ success: false, error: 'Invalid status' });
        }
        const holiday = await Holiday.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!holiday) return res.status(404).json({ success: false, error: 'Holiday not found' });
        res.status(200).json({ success: true, data: holiday });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Delete holiday
// @route   DELETE /api/admin/holidays/:id
// @access  Private/Admin
exports.deleteHoliday = async (req, res, next) => {
    try {
        const holiday = await Holiday.findById(req.params.id);
        if (!holiday) {
            return res.status(404).json({ success: false, error: 'Holiday not found' });
        }
        await holiday.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// ─── Recruitment Pipeline ────────────────────────────────────────────────────

// @desc    Get all candidates
// @route   GET /api/admin/recruitment
exports.getCandidates = async (req, res) => {
    try {
        const candidates = await Recruitment.find().sort('-createdAt');
        res.status(200).json({ success: true, data: candidates });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Add candidate
// @route   POST /api/admin/recruitment
exports.addCandidate = async (req, res) => {
    try {
        const candidate = await Recruitment.create(req.body);
        res.status(201).json({ success: true, data: candidate });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Take action on candidate (move stage / schedule interview / reject / notes)
// @route   PUT /api/admin/recruitment/:id/action
exports.candidateAction = async (req, res) => {
    try {
        const { action, stage, interviewDate, interviewMode, notes } = req.body;
        const update = {};
        if (stage) update.stage = stage;
        if (interviewDate !== undefined) update.interviewDate = interviewDate || null;
        if (interviewMode !== undefined) update.interviewMode = interviewMode;
        if (notes !== undefined) update.notes = notes;

        const logEntry = {
            action: action || (stage ? `Moved to ${stage}` : 'Updated'),
            by: req.user._id,
            byName: req.user.name,
            at: new Date(),
            note: notes || ''
        };

        const candidate = await Recruitment.findByIdAndUpdate(
            req.params.id,
            { ...update, $push: { actionLog: logEntry } },
            { new: true, runValidators: true }
        );
        if (!candidate) return res.status(404).json({ success: false, error: 'Candidate not found' });
        res.status(200).json({ success: true, data: candidate });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Delete candidate
// @route   DELETE /api/admin/recruitment/:id
exports.deleteCandidate = async (req, res) => {
    try {
        const candidate = await Recruitment.findById(req.params.id);
        if (!candidate) return res.status(404).json({ success: false, error: 'Candidate not found' });
        await candidate.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [employees, departments, leaves, todayAttendance] = await Promise.all([
            User.countDocuments({ role: 'employee' }),
            Department.countDocuments(),
            Leave.find().populate('employee', 'name email'),
            Attendance.find({ date: { $gte: today, $lt: tomorrow } })
        ]);

        const totalSalary = await User.aggregate([
            { $match: { role: 'employee' } },
            { $group: { _id: null, total: { $sum: '$salary' } } }
        ]);

        const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;
        const presentToday = todayAttendance.filter(a => a.status === 'Present').length;
        const absentToday = employees - presentToday;

        res.status(200).json({
            success: true,
            data: {
                employees,
                departments,
                pendingLeaves,
                totalSalary: totalSalary[0]?.total || 0,
                presentToday,
                absentToday,
                leaves: leaves.slice(-10).reverse()
            }
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
