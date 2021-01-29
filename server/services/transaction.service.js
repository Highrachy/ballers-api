import mongoose from 'mongoose';
import Transaction from '../models/transaction.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
import { OFFER_STATUS, USER_ROLE } from '../helpers/constants';
import Offer from '../models/offer.model';
import Referral from '../models/referral.model';
// eslint-disable-next-line import/no-cycle
import { getOfferById } from './offer.service';
import { generatePagination, generateFacetData, getPaginationTotal } from '../helpers/pagination';
import { NON_PROJECTED_USER_INFO } from '../helpers/projectedSchemaInfo';

const { ObjectId } = mongoose.Types.ObjectId;

export const getTransactionById = async (id) => Transaction.findById(id).select();
export const getTransactionByInfo = async (additionalInfo) =>
  Transaction.findOne({ additionalInfo }).select();

export const addTransaction = async (transaction) => {
  const offer = await getOfferById(transaction.offerId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (!offer) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Invalid offer');
  }

  if (offer.vendorId.toString() !== transaction.vendorId.toString()) {
    throw new ErrorHandler(httpStatus.UNAUTHORIZED, 'You are not permitted to perform this action');
  }

  if (offer.propertyId.toString() !== transaction.propertyId.toString()) {
    throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, 'Property not for offer');
  }

  if (offer.userId.toString() !== transaction.userId.toString()) {
    throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, 'User not for offer');
  }

  try {
    const newTransaction = await new Transaction(transaction).save();
    return newTransaction;
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error adding transaction', error);
  }
};

export const updateTransaction = async ({ transactionId, paidOn, vendorId }) => {
  const transaction = await getTransactionById(transactionId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (transaction.vendorId.toString() !== vendorId.toString()) {
    throw new ErrorHandler(httpStatus.UNAUTHORIZED, 'You are not permitted to perform this action');
  }
  try {
    return Transaction.findByIdAndUpdate(transaction.id, { $set: { paidOn } }, { new: true });
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error updating transaction', error);
  }
};

export const getAllTransactions = async (user, page = 1, limit = 10) => {
  const transactionOptions = [
    {
      $lookup: {
        from: 'properties',
        localField: 'propertyId',
        foreignField: '_id',
        as: 'propertyInfo',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'userInfo',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'vendorId',
        foreignField: '_id',
        as: 'vendorInfo',
      },
    },
    {
      $unwind: '$propertyInfo',
    },
    {
      $unwind: '$userInfo',
    },
    {
      $unwind: {
        path: '$vendorInfo',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $facet: {
        metadata: [{ $count: 'total' }, { $addFields: { page, limit } }],
        data: generateFacetData(page, limit),
      },
    },
    {
      $project: {
        ...NON_PROJECTED_USER_INFO('userInfo'),
        ...NON_PROJECTED_USER_INFO('vendorInfo'),
      },
    },
  ];

  if (user.role === USER_ROLE.VENDOR) {
    transactionOptions.unshift({ $match: { vendorId: ObjectId(user._id) } });
  }

  const transactions = await Transaction.aggregate(transactionOptions);

  const total = getPaginationTotal(transactions);
  const pagination = generatePagination(page, limit, total);
  const result = transactions[0].data;
  return { pagination, result };
};

export const getTransactionsByUser = async (userId) =>
  Transaction.aggregate([
    { $match: { userId: ObjectId(userId) } },
    {
      $lookup: {
        from: 'properties',
        localField: 'propertyId',
        foreignField: '_id',
        as: 'propertyInfo',
      },
    },
    {
      $unwind: '$propertyInfo',
    },
    {
      $project: {
        'propertyInfo.assignedTo': 0,
      },
    },
  ]);

export const getUserTransactionsByProperty = async (propertyId, user) => {
  const transactionOptions = [
    { $match: { propertyId: ObjectId(propertyId) } },
    {
      $lookup: {
        from: 'properties',
        localField: 'propertyId',
        foreignField: '_id',
        as: 'propertyInfo',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'userInfo',
      },
    },
    {
      $unwind: '$propertyInfo',
    },
    {
      $unwind: '$userInfo',
    },
    {
      $project: NON_PROJECTED_USER_INFO('userInfo'),
    },
  ];

  if (user.role === USER_ROLE.VENDOR) {
    transactionOptions.unshift({ $match: { vendorId: ObjectId(user._id) } });
  }

  const transaction = await Transaction.aggregate(transactionOptions);

  return transaction;
};

export const getTotalAmountPaidByUser = async (userId) =>
  Transaction.aggregate([
    { $match: { userId: ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalAmountPaid: { $sum: '$amount' },
      },
    },
  ]);

export const getContributionRewards = async (userId) =>
  Offer.aggregate([
    { $match: { userId: ObjectId(userId) } },
    {
      $match: {
        $or: [
          { status: OFFER_STATUS.GENERATED },
          { status: OFFER_STATUS.INTERESTED },
          { status: OFFER_STATUS.ASSIGNED },
          { status: OFFER_STATUS.ALLOCATED },
        ],
      },
    },
  ]);

export const getReferralRewards = async (referrerId) =>
  Referral.aggregate([{ $match: { referrerId: ObjectId(referrerId) } }]);
