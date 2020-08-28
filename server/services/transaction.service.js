import Transaction from '../models/transaction.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';

export const getTransactionById = async (id) => Transaction.findById(id).select();

export const getTransactionByReferenceNumber = async (referenceNumber, fields = null) =>
  Transaction.findOne({ referenceNumber }).select(fields);

export const generateReference = () => {
  let referenceNumber = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  for (let i = 0; i < 6; i += 1) {
    referenceNumber += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return referenceNumber;
};

export const generateReferenceNumber = async () => {
  let referenceNumber;
  let referenceNumberIsUsed = true;

  while (referenceNumberIsUsed) {
    referenceNumber = generateReference();
    // eslint-disable-next-line no-await-in-loop
    const invalidReferenceNumber = await getTransactionByReferenceNumber(referenceNumber).catch(
      (error) => {
        throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
      },
    );
    if (invalidReferenceNumber === null) {
      referenceNumberIsUsed = false;
    }
  }
  return referenceNumber;
};

export const addTransaction = async (transaction) => {
  const referenceNumber = await generateReferenceNumber().catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });
  try {
    const newTransaction = await new Transaction({
      ...transaction,
      referenceNumber,
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
