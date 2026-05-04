const Notification = require('../models/notificationModel');

// @desc    Get all notifications for logged in user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.find({ userId: req.user.id }).sort('-createdAt').limit(20);
        res.status(200).json({ success: true, count: notifications.length, data: notifications });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
    try {
        const notification = await Notification.findById(req.params.id);
        
        if (!notification) {
            return res.status(404).json({ success: false, error: 'Notification not found' });
        }

        if (notification.userId.toString() !== req.user.id) {
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }

        notification.isRead = true;
        await notification.save();

        res.status(200).json({ success: true, data: notification });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
