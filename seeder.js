const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/userModel');
const Department = require('./models/departmentModel');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const importData = async () => {
    try {
        await User.deleteMany();
        await Department.deleteMany();

        const dept1 = await Department.create({ name: 'Engineering', description: 'Software Development Team' });
        const dept2 = await Department.create({ name: 'HR', description: 'Human Resources' });

        await User.create([
            {
                name: 'Admin User',
                email: 'admin@company.com',
                password: 'admin123',
                role: 'admin',
                department: dept2._id,
                salary: 100000
            },
            {
                name: 'Employee One',
                email: 'emp@company.com',
                password: 'emp123',
                role: 'employee',
                department: dept1._id,
                salary: 60000
            }
        ]);

        console.log('Data Imported!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

importData();
