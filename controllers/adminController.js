const User = require('../models/userModel');
const Department = require('../models/departmentModel');
const Leave = require('../models/leaveModel');
const Notification = require('../models/notificationModel');

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
