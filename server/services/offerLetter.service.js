import mongoose from 'mongoose';
import OfferLetter from '../models/offerLetter.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
import { OFFER_STATUS } from '../helpers/constants';

const { ObjectId } = mongoose.Types.ObjectId;

export const getOfferById = async (id) => OfferLetter.findById(id).select();

export const createOffer = async (offer) => {
  try {
    const newOffer = await new OfferLetter(offer).save();
    return newOffer;
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error creating offer', error);
  }
};

export const acceptOffer = async (offerToAccept) => {
  const offer = await getOfferById(offerToAccept.offerId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  try {
    return OfferLetter.findOneAndUpdate(
      { _id: offer.id },
      {
        $set: {
          status: OFFER_STATUS.INTERESTED,
          signature: offerToAccept.signature,
          responseDate: Date.now(),
        },
      },
      { new: true },
    );
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error responding to offer', error);
  }
};

export const assignOffer = async (assignmentInfo) => {
  const offer = await getOfferById(assignmentInfo.offerId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  try {
    return OfferLetter.findByIdAndUpdate(offer.id, {
      $set: { status: OFFER_STATUS.ASSIGNED },
    });
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error assigning offer', error);
  }
};

export const getAllOffers = async (userId) =>
  OfferLetter.aggregate([
    { $match: { userId: ObjectId(userId) } },
    {
      $lookup: {
        from: 'users',
        localField: 'vendorId',
        foreignField: '_id',
        as: 'vendorInfo',
      },
    },
    {
      $lookup: {
        from: 'enquiries',
        localField: 'enquiryid',
        foreignField: '_id',
        as: 'enquiryInfo',
      },
    },
    {
      $lookup: {
        from: 'properties',
        localField: 'propertyId',
        foreignField: '_id',
        as: 'propertyInfo',
      },
    },
    {
      $unwind: '$vendorInfo',
    },
    {
      $unwind: '$enquiryInfo',
    },
    {
      $unwind: '$propertyInfo',
    },
    {
      $project: {
        'propertyInfo.assignedTo': 0,
        'vendorInfo.assignedProperties': 0,
        'vendorInfo.password': 0,
        'vendorInfo.referralCode': 0,
      },
    },
  ]);

export const getOffer = async (offerId) =>
  OfferLetter.aggregate([
    { $match: { _id: ObjectId(offerId) } },
    {
      $lookup: {
        from: 'users',
        localField: 'vendorId',
        foreignField: '_id',
        as: 'vendorInfo',
      },
    },
    {
      $lookup: {
        from: 'enquiries',
        localField: 'enquiryid',
        foreignField: '_id',
        as: 'enquiryInfo',
      },
    },
    {
      $lookup: {
        from: 'properties',
        localField: 'propertyId',
        foreignField: '_id',
        as: 'propertyInfo',
      },
    },
    {
      $unwind: '$vendorInfo',
    },
    {
      $unwind: '$enquiryInfo',
    },
    {
      $unwind: '$propertyInfo',
    },
    {
      $project: {
        'propertyInfo.assignedTo': 0,
        'vendorInfo.assignedProperties': 0,
        'vendorInfo.password': 0,
        'vendorInfo.referralCode': 0,
      },
    },
  ]);
