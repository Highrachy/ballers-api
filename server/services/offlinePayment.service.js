import mongoose from 'mongoose';
import OfflinePayment from '../models/offlinePayment.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
// eslint-disable-next-line import/no-cycle
import { getOfferById } from './offer.service';
import { generatePagination, generateFacetData, getPaginationTotal } from '../helpers/pagination';
import { NON_PROJECTED_USER_INFO } from '../helpers/projectedSchemaInfo';
import { USER_ROLE } from '../helpers/constants';

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
    return await new OfflinePayment({ ...offlinePayment, userId: offer.userId }).save();
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

  try {
    return OfflinePayment.findByIdAndUpdate(offlinePayment._id, offlinePaymentInfo, { new: true });
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error updating offline payment', error);
  }
};

export const getAllOfflinePayments = async (user, { page = 1, limit = 10 }) => {
  const offlinePaymentOptions = [
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

  if (user.role === USER_ROLE.USER) {
    offlinePaymentOptions.unshift({ $match: { userId: ObjectId(user._id) } });
  }

  const offlinePayments = await OfflinePayment.aggregate(offlinePaymentOptions);

  const total = getPaginationTotal(offlinePayments);
  const pagination = generatePagination(page, limit, total);
  const result = offlinePayments[0].data;
  return { pagination, result };
};
