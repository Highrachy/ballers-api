import mongoose from 'mongoose';
import Transaction from '../models/transaction.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
import { OFFER_STATUS } from '../helpers/constants';
import Offer from '../models/offer.model';
import Referral from '../models/referral.model';

const { ObjectId } = mongoose.Types.ObjectId;

export const getTransactionById = async (id) => Transaction.findById(id).select();
export const getTransactionByInfo = async (additionalInfo) =>
  Transaction.findOne({ additionalInfo }).select();

export const addTransaction = async (transaction) => {
  try {
    const newTransaction = await new Transaction(transaction).save();
    return newTransaction;
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error adding transaction', error);
  }
};

export const updateTransaction = async ({ transactionId, paidOn }) => {
  const transaction = await getTransactionById(transactionId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });
  try {
    return Transaction.findByIdAndUpdate(transaction.id, { $set: { paidOn } }, { new: true });
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error updating transaction', error);
  }
};

export const getAllTransactions = async () =>
  Transaction.aggregate([
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
        localField: 'adminId',
        foreignField: '_id',
        as: 'adminInfo',
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
        path: '$adminInfo',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        'propertyInfo.assignedTo': 0,
        'userInfo.assignedProperties': 0,
        'userInfo.password': 0,
        'userInfo.referralCode': 0,
        'adminInfo.assignedProperties': 0,
        'adminInfo.password': 0,
        'adminInfo.referralCode': 0,
      },
    },
  ]);

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

export const getUserTransactionsByProperty = async (propertyId) =>
  Transaction.aggregate([
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
      $project: {
        'propertyInfo.assignedTo': 0,
        'userInfo.assignedProperties': 0,
        'userInfo.password': 0,
        'userInfo.referralCode': 0,
      },
    },
  ]);

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
