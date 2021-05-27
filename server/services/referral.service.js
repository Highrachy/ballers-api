import mongoose from 'mongoose';
import Referral from '../models/referral.model';
import User from '../models/user.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
import { REFERRAL_STATUS, REWARD_STATUS, REFERRAL_PERCENTAGE } from '../helpers/constants';
// eslint-disable-next-line import/no-cycle
import { getUserById, getUserByEmail } from './user.service';

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

export const getAllUserReferrals = async (referrerId) =>
  Referral.aggregate([
    { $match: { referrerId: ObjectId(referrerId) } },
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
        'referrer.email': 1,
      },
    },
  ]);

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

export const updateReferralToRewarded = async (referralId) => {
  const referral = await getReferralById(referralId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  try {
    return Referral.findByIdAndUpdate(
      referral._id,
      { $set: { status: REFERRAL_STATUS.REWARDED, 'reward.status': REWARD_STATUS.PAID } },
      { new: true },
    );
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error rewarding referral', error);
  }
};

export const getAllReferrals = async () =>
  Referral.aggregate([
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
        'referrer.email': 1,
        'referrer.firstName': 1,
        'referrer.lastName': 1,
        'referrer.phone': 1,
      },
    },
  ]);

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

export const activatePendingUserReferral = async ({ userId, offer }) => {
  const referral = await Referral.findOne({
    userId: ObjectId(userId),
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
