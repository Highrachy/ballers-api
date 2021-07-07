import mongoose from 'mongoose';
import Transaction from '../models/transaction.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
import { ACTIVE_PORTFOLIO_OFFER, USER_ROLE } from '../helpers/constants';
import Offer from '../models/offer.model';
import Referral from '../models/referral.model';
// eslint-disable-next-line import/no-cycle
import { getOfferById } from './offer.service';
import { generatePagination, generateFacetData, getPaginationTotal } from '../helpers/pagination';
import {
  NON_PROJECTED_USER_INFO,
  EXCLUDED_PROPERTY_INFO,
  getExcludedTransactionInfo,
} from '../helpers/projectedSchemaInfo';
// eslint-disable-next-line import/no-cycle
import { generateNextPaymentDate } from './nextPayment.service';
// eslint-disable-next-line import/no-cycle
import { getUserById } from './user.service';
import { createNotification } from './notification.service';
import NOTIFICATIONS from '../helpers/notifications';
import { TRANSACTION_FILTERS, buildFilterAndSortQuery } from '../helpers/filters';
import { getMoneyFormat, getFormattedName } from '../helpers/funtions';
// eslint-disable-next-line import/no-cycle
import {
  getReferralByOfferId,
  updateReferralAccumulatedRewardAndRewardStatus,
} from './referral.service';
// eslint-disable-next-line import/no-cycle
import { assignBadgeAutomatically } from './assignedBadge.service';
import AUTOMATED_BADGES from '../helpers/automatedBadges';

const { ObjectId } = mongoose.Types.ObjectId;

export const getTransactionById = async (id) => Transaction.findById(id).select();
export const getTransactionByInfo = async (additionalInfo) =>
  Transaction.findOne({ additionalInfo }).select();

export const getTotalTransactionByOfferId = async (offerId) => {
  const total = await Transaction.aggregate([
    { $match: { offerId: ObjectId(offerId) } },
    {
      $group: {
        _id: null,
        totalAmountPaid: { $sum: '$amount' },
      },
    },
  ]);
  return total[0]?.totalAmountPaid || 0;
};

export const isUserFirstPayment = async (userId) => {
  const transaction = Transaction.find({ userId: ObjectId(userId) });

  return transaction.length === 1;
};

export const addTransaction = async (transaction) => {
  const offer = await getOfferById(transaction.offerId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (!offer) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Invalid offer');
  }

  try {
    const newTransaction = await new Transaction({
      ...transaction,
      userId: offer.userId,
      propertyId: offer.propertyId,
      vendorId: offer.vendorId,
      addedBy: offer.vendorId,
      updatedBy: offer.vendorId,
    }).save();

    await generateNextPaymentDate({
      transactionId: newTransaction._id,
      offerId: offer._id,
    }).catch((error) => {
      throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
    });

    const isFirstPayment = await isUserFirstPayment(offer.userId);
    if (isFirstPayment) {
      await assignBadgeAutomatically(AUTOMATED_BADGES.USER_FIRST_PAYMENT, offer.userId);
    }

    const referral = await getReferralByOfferId(offer._id);

    if (referral) {
      await updateReferralAccumulatedRewardAndRewardStatus({
        referralId: referral._id,
        transactionId: newTransaction._id,
        amountPaid: transaction.amount,
        offerId: offer._id,
      });
    }

    return newTransaction;
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error adding transaction', error);
  }
};

export const getAllTransactions = async (user, { page = 1, limit = 10, ...query } = {}) => {
  const { filterQuery, sortQuery } = buildFilterAndSortQuery(TRANSACTION_FILTERS, query);

  const transactionOptions = [
    { $match: { $and: filterQuery } },
    { $sort: sortQuery },
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
    { $unwind: '$propertyInfo' },
    { $unwind: '$userInfo' },
    {
      $unwind: {
        path: '$vendorInfo',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        ...NON_PROJECTED_USER_INFO('userInfo'),
        ...NON_PROJECTED_USER_INFO('vendorInfo', user.role),
        ...EXCLUDED_PROPERTY_INFO,
        ...getExcludedTransactionInfo(user.role),
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
    transactionOptions.splice(1, 1);
  }

  if (filterQuery.length < 1) {
    transactionOptions.shift();
  }

  if (user.role === USER_ROLE.VENDOR) {
    transactionOptions.unshift({ $match: { vendorId: ObjectId(user._id) } });
  }

  if (user.role === USER_ROLE.USER) {
    transactionOptions.unshift({ $match: { userId: ObjectId(user._id) } });
  }

  const transactions = await Transaction.aggregate(transactionOptions);

  const total = getPaginationTotal(transactions);
  const pagination = generatePagination(page, limit, total);
  const result = transactions[0].data;
  return { pagination, result };
};

export const getUserTransactionsByProperty = async (propertyId, user, page = 1, limit = 10) => {
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
    { $unwind: '$propertyInfo' },
    { $unwind: '$userInfo' },
    {
      $project: {
        ...NON_PROJECTED_USER_INFO('userInfo'),
        ...EXCLUDED_PROPERTY_INFO,
        ...getExcludedTransactionInfo(user.role),
      },
    },
    {
      $facet: {
        metadata: [{ $count: 'total' }, { $addFields: { page, limit } }],
        data: generateFacetData(page, limit),
      },
    },
  ];

  if (user.role === USER_ROLE.VENDOR) {
    transactionOptions.unshift({ $match: { vendorId: ObjectId(user._id) } });
  }

  if (user.role === USER_ROLE.USER) {
    transactionOptions.unshift({ $match: { userId: ObjectId(user._id) } });
  }

  const transactions = await Transaction.aggregate(transactionOptions);

  const total = getPaginationTotal(transactions);
  const pagination = generatePagination(page, limit, total);
  const result = transactions[0].data;
  return { pagination, result };
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
    { $match: { $or: ACTIVE_PORTFOLIO_OFFER } },
  ]);

export const getReferralRewards = async (referrerId) =>
  Referral.aggregate([{ $match: { referrerId: ObjectId(referrerId) } }]);

export const getOneTransaction = async (transactionId, user) => {
  const transactionOptions = [
    { $match: { _id: ObjectId(transactionId) } },
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
    { $unwind: '$propertyInfo' },
    { $unwind: '$userInfo' },
    { $unwind: '$vendorInfo' },
    {
      $project: {
        ...NON_PROJECTED_USER_INFO('userInfo'),
        ...NON_PROJECTED_USER_INFO('vendorInfo', user.role),
        ...EXCLUDED_PROPERTY_INFO,
        ...getExcludedTransactionInfo(user.role),
      },
    },
  ];

  if (user.role === USER_ROLE.VENDOR) {
    transactionOptions.unshift({ $match: { vendorId: ObjectId(user._id) } });
  }

  if (user.role === USER_ROLE.USER) {
    transactionOptions.unshift({ $match: { userId: ObjectId(user._id) } });
  }

  const transaction = await Transaction.aggregate(transactionOptions);

  if (transaction.length < 1) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Transaction not found');
  }

  return transaction[0];
};

export const addRemittance = async (remittanceInfo) => {
  const transaction = await getOneTransaction(remittanceInfo.transactionId, {
    role: USER_ROLE.ADMIN,
  }).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (!transaction) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Invalid transaction');
  }

  const user = await getUserById(transaction.vendorId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  const percentage = remittanceInfo.percentage || user.vendor.remittancePercentage;

  const amount = Math.round(((100 - percentage) / 100) * transaction.amount);

  try {
    const remittedTransaction = await Transaction.findByIdAndUpdate(
      transaction._id,
      {
        $set: {
          'remittance.amount': amount,
          'remittance.by': remittanceInfo.adminId,
          'remittance.date': remittanceInfo.date,
          'remittance.percentage': percentage,
          'remittance.status': true,
        },
      },
      { new: true },
    );

    const description = `You have received ${getMoneyFormat(
      amount,
    )} for your property ${getFormattedName(transaction.propertyInfo.name)}`;

    await createNotification(NOTIFICATIONS.REMITTANCE_PAID, user._id, {
      description,
      actionId: transaction._id,
    });

    return { transaction: remittedTransaction, user };
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error adding remittance', error);
  }
};

export const getPaymentDuration = async (offerId) => {
  const offer = await getOfferById(offerId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  const paymentsMade = await Transaction.find({ offerId });

  const totalPaid = paymentsMade.reduce((accum, transaction) => accum + transaction.amount, 0);

  const isFirstPayment = paymentsMade.length === 1 && totalPaid < offer.totalAmountPayable;
  const isLastPayment = totalPaid >= offer.totalAmountPayable;
  const isOtherPayment = !isFirstPayment && !isLastPayment;

  return { isLastPayment, isFirstPayment, isOtherPayment };
};
