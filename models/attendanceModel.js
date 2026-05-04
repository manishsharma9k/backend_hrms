const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'On Leave'],
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
