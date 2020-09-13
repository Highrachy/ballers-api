import mongoose from 'mongoose';
import Offer from '../models/offer.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
import { OFFER_STATUS } from '../helpers/constants';
import { getUserById } from './user.service';
import { getEnquiryById, approveEnquiry } from './enquiry.service';

const { ObjectId } = mongoose.Types.ObjectId;

export const getOfferById = async (id) => Offer.findById(id).select();

export const getAllOffers = async (userId) =>
  Offer.aggregate([
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
        localField: 'enquiryId',
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

export const getActiveOffers = async (userId) =>
  Offer.aggregate([
    { $match: { userId: ObjectId(userId) } },
    {
      $match: {
        $or: [
          { status: OFFER_STATUS.GENERATED },
          { status: OFFER_STATUS.INTERESTED },
          { status: OFFER_STATUS.ASSIGNED },
          { status: OFFER_STATUS.ALLOCATED },
        ],
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
    {
      $lookup: {
        from: 'enquiries',
        localField: 'enquiryId',
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
  Offer.aggregate([
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
        localField: 'enquiryId',
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
        'vendorInfo.role': 0,
        'vendorInfo.favorites': 0,
        'vendorInfo.activated': 0,
        'vendorInfo.phone': 0,
        'vendorInfo.notifications': 0,
      },
    },
  ]);

export const createOffer = async (offer) => {
  const enquiry = await getEnquiryById(offer.enquiryId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (!enquiry) {
    throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, 'Invalid enquiry');
  }

  if (enquiry.approved === true) {
    throw new ErrorHandler(
      httpStatus.PRECONDITION_FAILED,
      'Cannot create offer for approved enquiry',
    );
  }

  const user = await getUserById(enquiry.userId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });
  const userInfo = {
    firstName: user.firstName,
    email: user.email,
  };

  try {
    const newOffer = await new Offer({
      ...offer,
      userId: enquiry.userId,
      propertyId: enquiry.propertyId,
    }).save();
    await approveEnquiry({ enquiryId: enquiry._id, adminId: offer.vendorId });
    const offerInfo = await getOffer(newOffer._id);
    return { ...offerInfo[0], userInfo };
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error creating offer', error);
  }
};

export const acceptOffer = async (offerToAccept) => {
  const offer = await getOfferById(offerToAccept.offerId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  const expiryDate = new Date(offer.expires);
  if (Date.now() > expiryDate) {
    throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, 'Offer has expired');
  }

  try {
    await Offer.findByIdAndUpdate(
      offer.id,
      {
        $set: {
          status: OFFER_STATUS.INTERESTED,
          signature: offerToAccept.signature,
          responseDate: Date.now(),
        },
      },
      { new: true },
    );
    return await getOffer(offerToAccept.offerId);
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error responding to offer', error);
  }
};

export const assignOffer = async (offerId) => {
  const offer = await getOfferById(offerId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  try {
    await Offer.findByIdAndUpdate(
      offer.id,
      {
        $set: { status: OFFER_STATUS.ASSIGNED, dateAssigned: Date.now() },
      },
      { new: true },
    );
    return await getOffer(offerId);
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error assigning offer', error);
  }
};
