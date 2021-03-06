import mongoose from 'mongoose';
import Notification from '../models/notification.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
import { generatePagination, generateFacetData, getPaginationTotal } from '../helpers/pagination';
import { buildFilterAndSortQuery, NOTIFICATION_FILTERS } from '../helpers/filters';

const { ObjectId } = mongoose.Types.ObjectId;

export const createNotification = async (notification, userId, options = {}) => {
  try {
    const generatedNotification = await new Notification({
      userId,
      ...notification,
      ...options,
    }).save();
    return generatedNotification;
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error creating notification', error);
  }
};

export const markNotificationAsRead = async ({ userId, notificationId }) => {
  try {
    const readNotification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { $set: { read: true } },
      { new: true },
    );
    if (!readNotification) {
      throw new ErrorHandler(httpStatus.NOT_FOUND, 'Notification not found');
    }
    return readNotification;
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error marking notification as read', error);
  }
};

export const getAllNotifications = async (user, { page = 1, limit = 10, ...query } = {}) => {
  const { filterQuery, sortQuery } = buildFilterAndSortQuery(NOTIFICATION_FILTERS, query);

  const notificationOptions = [
    { $match: { $and: filterQuery } },
    { $sort: sortQuery },
    { $match: { userId: ObjectId(user._id) } },
    {
      $facet: {
        metadata: [{ $count: 'total' }, { $addFields: { page, limit } }],
        data: generateFacetData(page, limit),
      },
    },
    { $project: { preferences: 0, password: 0, notifications: 0 } },
  ];

  if (Object.keys(sortQuery).length === 0) {
    notificationOptions.splice(1, 1);
  }

  if (filterQuery.length < 1) {
    notificationOptions.shift();
  }

  const notifications = await Notification.aggregate(notificationOptions);
  const total = getPaginationTotal(notifications);
  const pagination = generatePagination(page, limit, total);
  const result = notifications[0].data;
  return { pagination, result };
};

export const markAllNotificationsAsRead = async (userId) => {
  try {
    const markedNotifications = await Notification.updateMany({ userId }, { $set: { read: true } });
    return { noOfMarkedNotifications: markedNotifications.nModified };
  } catch (error) {
    throw new ErrorHandler(
      httpStatus.BAD_REQUEST,
      'Error marking all notifications as read',
      error,
    );
  }
};
