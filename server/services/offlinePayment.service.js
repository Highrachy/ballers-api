import mongoose from 'mongoose';
import OfflinePayment from '../models/offlinePayment.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
import { getOfferById } from './offer.service';
import { generatePagination, generateFacetData, getPaginationTotal } from '../helpers/pagination';
import { NON_PROJECTED_USER_INFO } from '../helpers/projectedSchemaInfo';
import { COMMENT_STATUS, USER_ROLE } from '../helpers/constants';
import { getTodaysDateStandard } from '../helpers/dates';
import { buildFilterAndSortQuery, OFFLINE_PAYMENT_FILTERS } from '../helpers/filters';
import { addTransaction } from './transaction.service';

const { ObjectId } = mongoose.Types.ObjectId;
export const getOfflinePaymentById = async (id) => OfflinePayment.findById(id).select();

export const addOfflinePayment = async (offlinePayment) => {
  const offer = await getOfferById(offlinePayment.offerId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (!offer) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Invalid offer');
  }

  try {
    return await new OfflinePayment(offlinePayment).save();
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error adding offline payment', error);
  }
};

export const updateOfflinePayment = async ({ offlinePaymentInfo, userId }) => {
  const offlinePayment = await getOfflinePaymentById(offlinePaymentInfo.id).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (!offlinePayment) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Invalid offline payment');
  }

  if (offlinePayment.userId.toString() !== userId.toString()) {
    throw new ErrorHandler(httpStatus.FORBIDDEN, 'You are not permitted to perform this action');
  }

  if (offlinePayment.resolved.status) {
    throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, 'Payment has been resolved');
  }

  try {
    return OfflinePayment.findByIdAndUpdate(offlinePayment._id, offlinePaymentInfo, { new: true });
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error updating offline payment', error);
  }
};

export const getAllOfflinePayments = async (user, { page = 1, limit = 10, ...query } = {}) => {
  const { filterQuery, sortQuery } = buildFilterAndSortQuery(OFFLINE_PAYMENT_FILTERS, query);

  const offlinePaymentOptions = [
    { $match: { $and: filterQuery } },
    { $sort: sortQuery },
    {
      $lookup: {
        from: 'offers',
        localField: 'offerId',
        foreignField: '_id',
        as: 'offerInfo',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'offerInfo.userId',
        foreignField: '_id',
        as: 'userInfo',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'offerInfo.vendorId',
        foreignField: '_id',
        as: 'vendorInfo',
      },
    },
    { $unwind: '$offerInfo' },
    { $unwind: '$userInfo' },
    { $unwind: '$vendorInfo' },
    {
      $project: {
        ...NON_PROJECTED_USER_INFO('userInfo'),
        ...NON_PROJECTED_USER_INFO('vendorInfo'),
      },
    },
    {
      $facet: {
        metadata: [{ $count: 'total' }, { $addFields: { page, limit } }],
        data: generateFacetData(page, limit),
      },
    },
  ];

  if (Object.keys(sortQuery).length === 0) {
    offlinePaymentOptions.splice(1, 1);
  }

  if (filterQuery.length < 1) {
    offlinePaymentOptions.shift();
  }

  if (user.role === USER_ROLE.USER) {
    offlinePaymentOptions.unshift({ $match: { userId: ObjectId(user._id) } });
  }

  const offlinePayments = await OfflinePayment.aggregate(offlinePaymentOptions);

  const total = getPaginationTotal(offlinePayments);
  const pagination = generatePagination(page, limit, total);
  const result = offlinePayments[0].data;
  return { pagination, result };
};

export const resolveOfflinePayment = async ({ offlinePaymentId, adminId }) => {
  const offlinePayment = await getOfflinePaymentById(offlinePaymentId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });
  if (!offlinePayment) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Invalid offline payment');
  }

  for (let i = 0; i < offlinePayment.comments.length; i += 1) {
    if (offlinePayment.comments[i].status === COMMENT_STATUS.PENDING) {
      throw new ErrorHandler(
        httpStatus.PRECONDITION_FAILED,
        'Offline payment still has an unresolved comment',
      );
    }
  }

  const transaction = {
    offerId: offlinePayment.offerId,
    paymentSource: offlinePayment.type,
    amount: offlinePayment.amount,
    paidOn: offlinePayment.dateOfPayment,
    additionalInfo: `offlinePaymentId:${offlinePayment._id}`,
    addedBy: adminId,
    updatedBy: adminId,
  };

  try {
    await addTransaction(transaction).catch((error) => {
      throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
    });

    return OfflinePayment.findByIdAndUpdate(
      offlinePayment._id,
      { $set: { 'resolved.by': adminId, 'resolved.date': Date.now(), 'resolved.status': true } },
      { new: true },
    );
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error resolving offline payment', error);
  }
};

export const raiseComment = async ({ comment, user }) => {
  const offlinePayment = await getOfflinePaymentById(comment.paymentId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (!offlinePayment) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Invalid offline payment');
  }

  if (user.role === USER_ROLE.USER && offlinePayment.userId.toString() !== user._id.toString()) {
    throw new ErrorHandler(httpStatus.FORBIDDEN, 'You are not permitted to perform this action');
  }

  if (offlinePayment.resolved.status) {
    throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, 'Payment has been resolved');
  }

  try {
    const payment = await OfflinePayment.findByIdAndUpdate(
      offlinePayment._id,
      {
        $push: {
          comments: {
            askedBy: user._id,
            question: comment.question,
            status: COMMENT_STATUS.PENDING,
            dateAsked: getTodaysDateStandard(),
          },
        },
      },
      { new: true, safe: true, upsert: true },
    );

    return { payment };
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error raising comment', error);
  }
};

export const resolveComment = async ({ comment, user }) => {
  const offlinePayment = await getOfflinePaymentById(comment.paymentId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (!offlinePayment) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Invalid offline payment');
  }

  if (user.role === USER_ROLE.USER && offlinePayment.userId.toString() !== user._id.toString()) {
    throw new ErrorHandler(httpStatus.FORBIDDEN, 'You are not permitted to perform this action');
  }

  if (offlinePayment.resolved.status) {
    throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, 'Payment has been resolved');
  }

  try {
    const payment = await OfflinePayment.findOneAndUpdate(
      { _id: offlinePayment._id, 'comments._id': comment.commentId },
      {
        $set: {
          'comments.$.response': comment.response,
          'comments.$.dateResponded': getTodaysDateStandard(),
          'comments.$.respondedBy': user._id,
          'comments.$.status': COMMENT_STATUS.RESOLVED,
        },
      },
      { new: true },
    );

    return { payment };
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error resolving comment', error);
  }
};
