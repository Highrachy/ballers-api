import mongoose from 'mongoose';
import Offer from '../models/offer.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
import { OFFER_STATUS } from '../helpers/constants';
// eslint-disable-next-line import/no-cycle
import { getUserById } from './user.service';
import { getEnquiryById, approveEnquiry } from './enquiry.service';
import { getOneProperty } from './property.service';
import { getTodaysDateShortCode } from '../helpers/dates';

const { ObjectId } = mongoose.Types.ObjectId;

export const getOfferById = async (id) => Offer.findById(id).select();

export const getPropertyInitials = (propertyName) =>
  propertyName
    .match(/\b(\w)/g)
    .join('')
    .toUpperCase();

export const generateReferenceCode = async (propertyId) => {
  const property = await getOneProperty(propertyId);
  const vendorCode = 'HIG';
  const initials = getPropertyInitials(property[0].name);
  let numberSold = await Offer.countDocuments({ propertyId })
    .then((count) => count + 1)
    .catch((error) => {
      throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
    });
  numberSold = numberSold < 10 ? `0${numberSold}` : numberSold;
  const type = `OL${getPropertyInitials(property[0].houseType)}`;
  const referenceCode = `${vendorCode}/${initials}/${type}/${numberSold}/${getTodaysDateShortCode()}`;
  return referenceCode;
};

export const getAllOffersUser = async (userId) =>
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

export const getAllOffersAdmin = async (adminid) =>
  Offer.aggregate([
    { $match: { vendorId: ObjectId(adminid) } },
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
      $unwind: '$userInfo',
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
        'userInfo.assignedProperties': 0,
        'userInfo.password': 0,
        'userInfo.referralCode': 0,
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

export const calculateContributionReward = async (offerId) => {
  const offer = await getOffer(offerId);
  const propertyPrice = offer[0].propertyInfo.price;
  const offerPrice = offer[0].totalAmountPayable;
  const contributionReward = propertyPrice - offerPrice;

  try {
    return Offer.findByIdAndUpdate(offerId, { $set: { contributionReward } }, { new: true });
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error updating contribution reward', error);
  }
};

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
      'An offer letter exists for this enquiry. You will need to cancel / reject the offer letter to create a new offer letter',
    );
  }

  const referenceCode = await generateReferenceCode(enquiry.propertyId);
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
      referenceCode,
    }).save();
    await approveEnquiry({ enquiryId: enquiry._id, adminId: offer.vendorId });
    await calculateContributionReward(newOffer._id);
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

  if (offer.status !== OFFER_STATUS.INTERESTED) {
    throw new ErrorHandler(
      httpStatus.PRECONDITION_FAILED,
      'Offer letter has to be accepted before it can be assigned',
    );
  }

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

export const cancelOffer = async (offerId) => {
  const offer = await getOfferById(offerId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  try {
    return Offer.findByIdAndUpdate(
      offer.id,
      { $set: { status: OFFER_STATUS.CANCELLED } },
      { new: true },
    );
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error cancelling offer', error);
  }
};
