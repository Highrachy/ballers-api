import mongoose from 'mongoose';
import Referral from '../models/referral.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
import { REFERRAL_STATUS } from '../helpers/constants';

const { ObjectId } = mongoose.Types.ObjectId;

export const addReferral = async (referalInfo) => {
  const info = {
    userId: referalInfo.userId,
    refereeId: referalInfo.refereeId,
    registrationDate: Date.now(),
  };

  try {
    const referralInfo = await new Referral(info).save();
    return referralInfo;
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error adding referral info', error);
  }
};

export const getReferraslByRefereeId = async (refereeId) =>
  Referral.aggregate([
    { $match: { refereeId: ObjectId(refereeId) } },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $unwind: '$user',
    },
    {
      $project: {
        _id: 1,
        refereeId: 1,
        registrationDate: 1,
        status: 1,
        'user._id': 1,
        'user.email': 1,
      },
    },
  ]);

export const updateReferralToRegistered = async (referralId) => {
  try {
    return Referral.findByIdAndUpdate(
      referralId,
      { $set: { status: REFERRAL_STATUS.REGISTERED } },
      { new: true },
    );
  } catch (error) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Referral not found', error);
  }
};

export const updateReferralToRewarded = async (referralId) => {
  try {
    return Referral.findByIdAndUpdate(
      referralId,
      { $set: { status: REFERRAL_STATUS.REWARDED } },
      { new: true },
    );
  } catch (error) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Referral not found', error);
  }
};
