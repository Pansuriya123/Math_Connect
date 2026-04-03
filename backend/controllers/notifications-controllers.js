import Notification from '../models/notification.js';
import HttpError from '../models/http-error.js';

export const getNotifications = async (req, res, next) => {
  const userId = req.userData.userId;

  try {
    const notifications = await Notification.find({ recipient: userId })
      .populate('sender', 'username profile_photo')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ notifications });
  } catch (err) {
    const error = new HttpError('Fetching notifications failed.', 500);
    return next(error);
  }
};

export const markNotificationRead = async (req, res, next) => {
  const notificationId = req.params.nid;

  try {
    const notification = await Notification.findById(notificationId);
    if (notification) {
      notification.isRead = true;
      await notification.save();
    }
    res.json({ message: 'Marked as read' });
  } catch (err) {
    const error = new HttpError('Updating notification failed.', 500);
    return next(error);
  }
};

export const markAllRead = async (req, res, next) => {
  const userId = req.userData.userId;

  try {
    await Notification.updateMany({ recipient: userId }, { isRead: true });
    res.json({ message: 'Marked all as read' });
  } catch (err) {
    const error = new HttpError('Updating notifications failed.', 500);
    return next(error);
  }
};
