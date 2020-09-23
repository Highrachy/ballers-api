import mongoose from 'mongoose';
import Referral from '../models/referral.model';
import User from '../models/user.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
import { REFERRAL_STATUS } from '../helpers/constants';
// eslint-disable-next-line import/no-cycle
import { getUserById, getUserByEmail } from './user.service';

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
        localField: 'referrerId',
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
        status: 1,
        'referee._id': 1,
        'referee.email': 1,
      },
    },
  ]);

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

export const getReferralByEmail = async (email, fields = null) =>
  Referral.findOne({ email }).select(fields);

export const sendReferralInvite = async (invite) => {
  const referral = await getReferralByEmail(invite.email).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (referral && referral.referrerId.toString() === invite.referrerId.toString()) {
    throw new ErrorHandler(
      httpStatus.PRECONDITION_FAILED,
      'Multiple invites cannot be sent to same email',
    );
  }

  const existingUser = await getUserByEmail(invite.email).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (existingUser) {
    throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, "You can't refer a BALLER to BALLERS");
  }

  const referrer = await getUserById(invite.referrerId);

  try {
    await addReferral(invite);
    return {
      referrerName: referrer.firstName,
      email: invite.email,
      referralCode: referrer.referralCode,
    };
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error sending invite', error);
  }
};

export const getReferralById = async (referralId) =>
  Referral.aggregate([
    { $match: { _id: ObjectId(referralId) } },
    {
      $lookup: {
        from: 'users',
        localField: 'referrerId',
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
        status: 1,
        'referee._id': 1,
        'referee.email': 1,
      },
    },
  ]);

export const getAllReferrals = async () =>
  Referral.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'referrerId',
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
        status: 1,
        'referee._id': 1,
        'referee.email': 1,
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
