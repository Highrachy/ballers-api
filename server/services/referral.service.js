import mongoose from 'mongoose';
import Referral from '../models/referral.model';
import User from '../models/user.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
import {
  REFERRAL_STATUS,
  REWARD_STATUS,
  REFERRAL_PERCENTAGE,
  USER_ROLE,
} from '../helpers/constants';
// eslint-disable-next-line import/no-cycle
import { getUserById, getUserByEmail } from './user.service';
// eslint-disable-next-line import/no-cycle
import { getPaymentDuration } from './transaction.service';
import { REFERRAL_FILTERS, buildFilterAndSortQuery } from '../helpers/filters';
import { generatePagination, generateFacetData, getPaginationTotal } from '../helpers/pagination';
import { projectedReferralInfoForAdmin } from '../helpers/projectedSchemaInfo';

const { ObjectId } = mongoose.Types.ObjectId;

export const getReferralByEmailAndReferrerId = async (email, referrerId) =>
  Referral.aggregate([
    {
      $match: {
        $and: [{ email }, { referrerId: ObjectId(referrerId) }],
      },
    },
  ]);

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
    {
      $unwind: '$referrer',
    },
    {
      $project: {
        _id: 1,
        userId: 1,
        firstName: 1,
        email: 1,
        referrerId: 1,
        reward: 1,
        status: 1,
        'referrer._id': 1,
        'referrer.firstName': 1,
        'referrer.lastName': 1,
        'referrer.referralCode': 1,
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

  try {
    return Referral.findByIdAndUpdate(
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
        localField: 'referrerId',
        foreignField: '_id',
        as: 'referrer',
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
    { $unwind: '$referrer' },
    {
      $unwind: {
        path: '$propertyInfo',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        userId: 1,
        firstName: 1,
        email: 1,
        referrerId: 1,
        reward: 1,
        status: 1,
        'referrer._id': 1,
        'referrer.email': 1,
        'referrer.firstName': 1,
        'referrer.lastName': 1,
        'referrer.phone': 1,
        offerInfo: 1,
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
          localField: 'userId',
          foreignField: '_id',
          as: 'referee',
        },
      },
      { $unwind: '$referee' },
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
        referralRewards: { $sum: '$reward.amount' },
      },
    },
  ]);

export const activatePendingUserReferral = async (offer) => {
  const referral = await Referral.findOne({
    userId: ObjectId(offer.userId),
    status: REFERRAL_STATUS.REGISTERED,
    'reward.status': REWARD_STATUS.PENDING,
  });

  if (referral) {
    const amount = Math.round((REFERRAL_PERCENTAGE / 100) * offer.totalAmountPayable);
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

export const updateReferralRewardStatus = async ({ referralId, offerId }) => {
  const paymentType = await getPaymentDuration(offerId);
  let rewardStatus = REWARD_STATUS.PAYMENT_IN_PROGRESS;

  if (paymentType.isFirstPayment) {
    rewardStatus = REWARD_STATUS.PAYMENT_STARTED;
  }

  if (paymentType.isLastPayment) {
    rewardStatus = REWARD_STATUS.PAYMENT_COMPLETED;
  }

  await Referral.findByIdAndUpdate(
    referralId,
    { $set: { offerId, 'reward.status': rewardStatus } },
    { new: true },
  );
};

export const getReferralByOfferId = async (offerId) =>
  Referral.findOne({ offerId: ObjectId(offerId) });
