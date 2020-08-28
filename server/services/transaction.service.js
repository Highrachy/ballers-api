import Transaction from '../models/transaction.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';

export const getTransactionById = async (id) => Transaction.findById(id).select();

export const addTransaction = async (transaction) => {
  try {
    const newTransaction = await new Transaction({
      ...transaction,
      paidOn: Date.now(),
    }).save();
    return newTransaction;
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error adding transaction', error);
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
      $unwind: '$adminInfo',
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
