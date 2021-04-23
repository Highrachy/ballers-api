import {
  markNotificationAsRead,
  getAllNotifications,
  getOneNotification,
  markAllNotificationsAsRead,
} from '../services/notification.service';
import httpStatus from '../helpers/httpStatus';

const NotificationController = {
  markNotificationAsRead(req, res, next) {
    const notificationId = req.params.id;
    const userId = req.user._id;
    markNotificationAsRead({ userId, notificationId })
      .then((user) => {
        res
          .status(httpStatus.OK)
          .json({ success: true, message: 'Notification marked as read', user });
      })
      .catch((error) => next(error));
  },

  getAllNotifications(req, res, next) {
    const { user, query } = req;
    getAllNotifications(user, query)
      .then(({ pagination, result }) => {
        res.status(httpStatus.OK).json({
          success: true,
          pagination,
          result,
        });
      })
      .catch((error) => next(error));
  },

  getOneNotification(req, res, next) {
    const notificationId = req.params.id;
    const userId = req.user._id;
    getOneNotification({ notificationId, userId })
      .then((notification) => {
        if (notification) {
          res.status(httpStatus.OK).json({ success: true, notification });
        } else {
          res
            .status(httpStatus.NOT_FOUND)
            .json({ success: false, message: 'Notification not found' });
        }
      })
      .catch((error) => next(error));
  },

  markAllNotificationsAsRead(req, res, next) {
    const userId = req.user._id;
    markAllNotificationsAsRead(userId)
      .then((notifications) => {
        res
          .status(httpStatus.OK)
          .json({ success: true, message: 'All notifications marked as read', notifications });
      })
      .catch((error) => next(error));
  },
};

export default NotificationController;
