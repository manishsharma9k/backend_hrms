const express = require('express');
const {
    getEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getDepartments,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    getAllLeaves,
    updateLeaveStatus
} = require('../controllers/adminController');

const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes here are protected and restricted to admin
router.use(protect);
router.use(authorize('admin'));

router.route('/employees')
    .get(getEmployees)
    .post(addEmployee);

router.route('/employees/:id')
    .put(updateEmployee)
    .delete(deleteEmployee);

router.route('/departments')
    .get(getDepartments)
    .post(addDepartment);

router.route('/departments/:id')
    .put(updateDepartment)
    .delete(deleteDepartment);

router.route('/leaves')
    .get(getAllLeaves);

router.route('/leaves/:id')
    .put(updateLeaveStatus);

module.exports = router;
