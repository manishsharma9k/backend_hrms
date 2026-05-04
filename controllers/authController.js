const User = require('../models/userModel');
const Department = require('../models/departmentModel');
const crypto = require('crypto');

// @desc    Get departments for registration
// @route   GET /api/auth/departments
// @access  Public
exports.getPublicDepartments = async (req, res, next) => {
    try {
        const departments = await Department.find().select('name _id');
        res.status(200).json({ success: true, data: departments });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
// @desc    Register a new user (initial admin setup if needed)
// @route   POST /api/auth/register
// @access  Public (should be restricted in production)
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, role, department } = req.body;

        const user = await User.create({
            name,
            email,
            password,
            role,
            department
        });

        sendTokenResponse(user, 201, res);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ success: false, error: 'Email already exists. Please use a different email or log in.' });
        }
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Please provide an email and password' });
        }

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).populate('department');

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        data: {}
    });
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return res.status(404).json({ success: false, error: 'There is no user with that email' });
        }

        // Get reset token
        const resetToken = user.getResetPasswordToken();

        await user.save({ validateBeforeSave: false });

        // Create reset url
        const resetUrl = `http://localhost:5173/resetpassword/${resetToken}`;

        // Instead of sending email, log it to console and return success
        console.log(`\n\n======================================`);
        console.log(`🔑 PASSWORD RESET LINK:`);
        console.log(`${resetUrl}`);
        console.log(`======================================\n\n`);

        res.status(200).json({ success: true, data: 'Email sent (check backend console for link)' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Email could not be sent' });
    }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res, next) => {
    try {
        // Get hashed token
        const resetPasswordToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, error: 'Invalid or expired token' });
        }

        // Set new password
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({ success: true, data: 'Password updated successfully' });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
