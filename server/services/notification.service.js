import mongoose from 'mongoose';
import Notification from '../models/notification.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
import { NOTIFICATION_STATUS } from '../helpers/constants';
import { generatePagination, generateFacetData, getPaginationTotal } from '../helpers/pagination';
import { buildFilterAndSortQuery, NOTIFICATION_FILTERS } from '../helpers/filters';
import NOTIFICATIONS from '../../notifications/index';

const { ObjectId } = mongoose.Types.ObjectId;

export const getOneNotification = async ({ notificationId, userId }) => {
  return Notification.findOne({ _id: notificationId, userId });
};

export const createNotification = async (data) => {
  try {
    const notification = await new Notification({
      userId: data.userId,
      description: NOTIFICATIONS[data.description].description,
      type: NOTIFICATIONS[data.description].type,
      URL: NOTIFICATIONS[data.description].url,
    }).save();
    return notification;
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error creating notification', error);
  }
};

export const markNotificationAsRead = async ({ userId, notificationId }) => {
  try {
    return Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { $set: { status: NOTIFICATION_STATUS.READ } },
      { new: true },
    );
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
