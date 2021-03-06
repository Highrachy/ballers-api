import mongoose from 'mongoose';
import Referral from '../models/referral.model';
import User from '../models/user.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
import { REFERRAL_STATUS, REWARD_STATUS, USER_ROLE } from '../helpers/constants';
// eslint-disable-next-line import/no-cycle
import { getUserById, getUserByEmail } from './user.service';
// eslint-disable-next-line import/no-cycle
import { getPaymentDuration } from './transaction.service';
import { REFERRAL_FILTERS, buildFilterAndSortQuery } from '../helpers/filters';
import { generatePagination, generateFacetData, getPaginationTotal } from '../helpers/pagination';
import {
  projectedReferralInfoForAdmin,
  projectedReferralUserInfo,
  PROJECTED_REFERRAL_INFO,
} from '../helpers/projectedSchemaInfo';
import { createNotification } from './notification.service';
import NOTIFICATIONS from '../helpers/notifications';
import { getMoneyFormat } from '../helpers/funtions';

const { ObjectId } = mongoose.Types.ObjectId;

export const getReferralByEmailAndReferrerId = async (email, referrerId) =>
  Referral.aggregate([
    {
      $match: {
        $and: [{ email }, { referrerId: ObjectId(referrerId) }],
      },
    },
  ]);

export const getReferralBasicInfoById = async (id) => Referral.findById(id).select();

export const addReferral = async (referalInfo) => {
  const invitedReferral = await getReferralByEmailAndReferrerId(
    referalInfo.email,
    referalInfo.referrerId,
  ).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (
    invitedReferral.length > 0 &&
    invitedReferral[0].referrerId.toString() === referalInfo.referrerId.toString()
  ) {
    return Referral.findByIdAndUpdate(
      invitedReferral[0]._id,
      { $set: { status: REFERRAL_STATUS.REGISTERED, userId: referalInfo.userId } },
      { new: true },
    );
  }

  try {
    const referralInfo = await new Referral(referalInfo).save();
    return referralInfo;
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error adding referral info', error);
  }
};

export const sendReferralInvite = async (invite) => {
  const existingUser = await getUserByEmail(invite.email).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });
  if (existingUser) {
    throw new ErrorHandler(
      httpStatus.PRECONDITION_FAILED,
      `${invite.email} has already registered on Ballers.`,
    );
  }

  const referral = await getReferralByEmailAndReferrerId(invite.email, invite.referrerId).catch(
    (error) => {
      throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
    },
  );
  if (referral.length > 0 && referral[0].referrerId.toString() === invite.referrerId.toString()) {
    throw new ErrorHandler(
      httpStatus.PRECONDITION_FAILED,
      'Multiple invites cannot be sent to same email',
    );
  }

  const referrer = await getUserById(invite.referrerId);
  try {
    const referralMessage = await addReferral(invite);
    return {
      _id: referralMessage._id,
      referrerName: referrer.firstName,
      email: invite.email,
      referralCode: referrer.referralCode,
    };
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error sending invite', error);
  }
};

export const getReferralById = async (referralId) => {
  const [referral] = await Referral.aggregate([
    { $match: { _id: ObjectId(referralId) } },
    {
      $lookup: {
        from: 'users',
        localField: 'referrerId',
        foreignField: '_id',
        as: 'referrer',
      },
    },
    { $unwind: '$referrer' },
    {
      $project: {
        ...PROJECTED_REFERRAL_INFO,
        ...projectedReferralUserInfo('referrer'),
      },
    },
  ]);

  if (!referral) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Referral not found');
  }

  return referral;
};

export const updateReferralToRewarded = async ({ referralId, adminId }) => {
  const referral = await getReferralById(referralId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (referral.reward.status === REWARD_STATUS.REFERRAL_PAID) {
    throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, 'Referral has been paid previously');
  }

  if (referral.reward.status !== REWARD_STATUS.PAYMENT_COMPLETED) {
    throw new ErrorHandler(
      httpStatus.PRECONDITION_FAILED,
      'Payment for offer has not been completed',
    );
  }

  const referrer = await getUserById(referral.referrerId);

  try {
    const rewardedReferral = await Referral.findByIdAndUpdate(
      referral._id,
      {
        $set: {
          status: REFERRAL_STATUS.REWARDED,
          'reward.status': REWARD_STATUS.REFERRAL_PAID,
          'reward.paidBy': adminId,
          'reward.paidOn': Date.now(),
        },
      },
      { new: true },
    );

    const description = `You have received a referral bonus of ${getMoneyFormat(
      referral.reward.amount,
    )} as commission for your referral`;

    await createNotification(NOTIFICATIONS.REWARD_REFERRAL, referral.referrerId, {
      actionId: referral._id,
      description,
    });

    return { referral: rewardedReferral, referrer };
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error rewarding referral', error);
  }
};

export const getAllReferrals = async (user, { page = 1, limit = 10, ...query } = {}) => {
  const { filterQuery, sortQuery } = buildFilterAndSortQuery(REFERRAL_FILTERS, query);

  const referralOptions = [
    { $match: { $and: filterQuery } },
    { $sort: sortQuery },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'referee',
      },
    },
    {
      $lookup: {
        from: 'offers',
        localField: 'offerId',
        foreignField: '_id',
        as: 'offerInfo',
      },
    },
    {
      $unwind: {
        path: '$offerInfo',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'properties',
        localField: 'offerInfo.propertyId',
        foreignField: '_id',
        as: 'propertyInfo',
      },
    },
    {
      $unwind: {
        path: '$referee',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: '$propertyInfo',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        ...PROJECTED_REFERRAL_INFO,
        offerInfo: 1,
        ...projectedReferralUserInfo('referee'),
        ...projectedReferralInfoForAdmin(user.role),
      },
    },
    {
      $facet: {
        metadata: [{ $count: 'total' }, { $addFields: { page, limit } }],
        data: generateFacetData(page, limit),
      },
    },
  ];

  if (user.role === USER_ROLE.ADMIN) {
    referralOptions.splice(
      4,
      0,
      {
        $lookup: {
          from: 'users',
          localField: 'referrerId',
          foreignField: '_id',
          as: 'referrer',
        },
      },
      { $unwind: '$referrer' },
    );
  }

  if (Object.keys(sortQuery).length === 0) {
    referralOptions.splice(1, 1);
  }

  if (filterQuery.length < 1) {
    referralOptions.shift();
  }

  if (user.role !== USER_ROLE.ADMIN) {
    referralOptions.unshift({ $match: { referrerId: ObjectId(user._id) } });
  }

  const referrals = await Referral.aggregate(referralOptions);

  const total = getPaginationTotal(referrals);
  const pagination = generatePagination(page, limit, total);
  const result = referrals[0].data;
  return { pagination, result };
};

export const getUserByRefCode = async (refCode) =>
  User.aggregate([
    { $match: { referralCode: refCode } },
    {
      $project: {
        _id: 1,
        lastName: 1,
        firstName: 1,
        email: 1,
      },
    },
  ]);

export const calculateReferralRewards = async (referrerId) =>
  Referral.aggregate([
    { $match: { referrerId: ObjectId(referrerId) } },
    {
      $group: {
        _id: null,
        referralRewards: { $sum: '$accumulatedReward.total' },
      },
    },
  ]);

export const activatePendingUserReferral = async (offer) => {
  const referral = await Referral.findOne({
    userId: ObjectId(offer.userId),
    status: REFERRAL_STATUS.REGISTERED,
    'reward.status': REWARD_STATUS.PENDING,
  });

  const user = await getUserById(offer.userId);

  if (!user) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'User not found');
  }

  if (referral) {
    const percentage = user.additionalInfo.referralPercentage;
    const amount = Math.round((percentage / 100) * offer.totalAmountPayable);

    try {
      await Referral.findByIdAndUpdate(
        referral._id,
        {
          $set: {
            offerId: offer._id,
            'reward.amount': amount,
            'reward.status': REWARD_STATUS.STARTED,
          },
        },
        { new: true },
      );
    } catch (error) {
      throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error starting referral', error);
    }
  }
};

export const getReferralByOfferId = async (offerId) =>
  Referral.findOne({ offerId: ObjectId(offerId) });

export const updateReferralAccumulatedRewardAndRewardStatus = async ({
  referralId,
  transactionId,
  offerId,
  amountPaid,
}) => {
  const paymentType = await getPaymentDuration(offerId);
  let rewardStatus = REWARD_STATUS.PAYMENT_IN_PROGRESS;

  if (paymentType.isFirstPayment) {
    rewardStatus = REWARD_STATUS.PAYMENT_STARTED;
  }

  if (paymentType.isLastPayment) {
    rewardStatus = REWARD_STATUS.PAYMENT_COMPLETED;
  }

  const referral = await getReferralBasicInfoById(referralId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  const user = await getUserById(referral.referrerId);

  const percentage = user.additionalInfo.referralPercentage;
  const amount = (percentage / 100) * amountPaid;
  const previousTotal = referral.accumulatedReward.transactions.reduce(
    (acc, transaction) => acc + transaction.amount,
    0,
  );
  const total = amount + previousTotal;

  const accumulatedReward = {
    total,
    transactions: [
      { transactionId, percentage, amount },
      ...referral.accumulatedReward.transactions,
    ],
  };

  try {
    return Referral.findByIdAndUpdate(
      referral._id,
      { $set: { accumulatedReward, offerId, 'reward.status': rewardStatus } },
      { new: true },
    );
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error updating assigned referral', error);
  }
};
