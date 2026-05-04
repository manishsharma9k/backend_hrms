const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a department name'],
        unique: true
    },
    description: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('Department', DepartmentSchema);
