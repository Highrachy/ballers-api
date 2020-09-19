import mongoose from 'mongoose';
import Referral from '../models/referral.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
import { REFERRAL_STATUS } from '../helpers/constants';
// eslint-disable-next-line import/no-cycle
import { getUserById } from './user.service';

const { ObjectId } = mongoose.Types.ObjectId;

export const addReferral = async (referalInfo) => {
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
        localField: 'userId',
        foreignField: '_id',
        as: 'referee',
      },
    },
    {
      $unwind: '$referee',
    },
    {
      $project: {
        _id: 1,
        userId: 1,
        firstName: 1,
        email: 1,
        referrerId: 1,
        reward: 1,
        'referee._id': 1,
        'referee.email': 1,
      },
    },
  ]);

export const updateReferralToRewarded = async (referralId) => {
  try {
    return Referral.findByIdAndUpdate(
      referralId,
      { $set: { reward: { status: REFERRAL_STATUS.REWARDED } } },
      { new: true },
    );
  } catch (error) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Referral not found', error);
  }
};

export const getReferralByEmail = async (email, fields = null) =>
  Referral.findOne({ email }).select(fields);

export const sendReferralInvite = async ({ referrerId, email }) => {
  const referral = await getReferralByEmail(email).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (referral) {
    throw new ErrorHandler(
      httpStatus.PRECONDITION_FAILED,
      'Multiple invites cannot be sent to same email',
    );
  }
  const referrer = await getUserById(referrerId);

  try {
    await addReferral({ referrerId, email });
    return {
      referrerName: `${referrer.firstName} ${referrer.lastName}`,
      email,
      referralCode: referrer.referralCode,
    };
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error sending invite', error);
  }
};
