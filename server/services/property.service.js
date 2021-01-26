import mongoose from 'mongoose';
import Property from '../models/property.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
import Transaction from '../models/transaction.model';
// eslint-disable-next-line import/no-cycle
import { getOffer } from './offer.service';
import {
  OFFER_STATUS,
  USER_ROLE,
  PROJECTED_VENDOR_INFO,
  PROJECTED_PROPERTY_INFO,
  PROJECTED_ASSIGNED_USER_INFO,
} from '../helpers/constants';
import Offer from '../models/offer.model';

const { ObjectId } = mongoose.Types.ObjectId;

export const getPropertyById = async (id) => Property.findById(id).select();

export const addProperty = async (property) => {
  try {
    const addedProperty = await new Property(property).save();
    return addedProperty;
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error adding property', error);
  }
};

export const updateProperty = async (updatedProperty) => {
  const property = await getPropertyById(updatedProperty.id).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  try {
    if (updatedProperty.vendor._id.toString() !== property.addedBy.toString()) {
      throw new ErrorHandler(httpStatus.FORBIDDEN, 'You are not permitted to perform this action');
    }

    return Property.findByIdAndUpdate(property.id, updatedProperty, { new: true });
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error updating property', error);
  }
};

export const deleteProperty = async ({ propertyId, user }) => {
  const property = await getPropertyById(propertyId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  try {
    if (user.role === USER_ROLE.VENDOR && user._id.toString() !== property.addedBy.toString()) {
      throw new ErrorHandler(httpStatus.FORBIDDEN, 'You are not permitted to perform this action');
    }

    return Property.findByIdAndDelete(property.id);
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error deleting property', error);
  }
};

export const getAllPropertiesAddedByVendor = async (vendorId) =>
  Property.aggregate([
    { $match: { addedBy: ObjectId(vendorId) } },
    {
      $lookup: {
        from: 'users',
        localField: 'assignedTo',
        foreignField: '_id',
        as: 'assignedUsers',
      },
    },
    {
      $lookup: {
        from: 'paymentplans',
        localField: 'paymentPlan',
        foreignField: '_id',
        as: 'paymentPlan',
      },
    },
    {
      $project: {
        ...PROJECTED_PROPERTY_INFO,
        ...PROJECTED_ASSIGNED_USER_INFO,
      },
    },
  ]);

export const getAllProperties = async (user) => {
  const propertiesOptions = [
    {
      $lookup: {
        from: 'users',
        localField: 'assignedTo',
        foreignField: '_id',
        as: 'assignedUsers',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'addedBy',
        foreignField: '_id',
        as: 'vendorInfo',
      },
    },
    {
      $lookup: {
        from: 'paymentplans',
        localField: 'paymentPlan',
        foreignField: '_id',
        as: 'paymentPlan',
      },
    },
    {
      $unwind: '$vendorInfo',
    },
    {
      $project: {
        ...PROJECTED_PROPERTY_INFO,
        ...PROJECTED_VENDOR_INFO,
        ...PROJECTED_ASSIGNED_USER_INFO,
      },
    },
  ];

  if (user.role === USER_ROLE.VENDOR) {
    propertiesOptions.unshift({ $match: { addedBy: ObjectId(user._id) } });
  }

  const properties = await Property.aggregate(propertiesOptions);

  return properties;
};

export const getOneProperty = async (propertyId) =>
  Property.aggregate([
    { $match: { _id: ObjectId(propertyId) } },
    {
      $lookup: {
        from: 'users',
        localField: 'addedBy',
        foreignField: '_id',
        as: 'vendorInfo',
      },
    },
    {
      $lookup: {
        from: 'paymentplans',
        localField: 'paymentPlan',
        foreignField: '_id',
        as: 'paymentPlan',
      },
    },
    {
      $unwind: '$vendorInfo',
    },
    {
      $project: {
        ...PROJECTED_PROPERTY_INFO,
        ...PROJECTED_VENDOR_INFO,
      },
    },
  ]);

export const searchThroughProperties = async ({
  userId,
  state,
  city,
  houseType,
  minPrice,
  maxPrice,
}) =>
  Property.aggregate([
    { $match: { assignedTo: { $nin: [ObjectId(userId)] } } },
    {
      $match: {
        $and: [
          { 'address.state': state || /.*/ },
          { 'address.city': city || /.*/ },
          { houseType: houseType || /.*/ },
          {
            price: {
              $gte: minPrice || 0,
              $lte: maxPrice || 10000000000000,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'assignedTo',
        foreignField: '_id',
        as: 'assignedUsers',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'addedBy',
        foreignField: '_id',
        as: 'vendorInfo',
      },
    },
    {
      $unwind: '$vendorInfo',
    },
    {
      $project: {
        ...PROJECTED_PROPERTY_INFO,
        ...PROJECTED_VENDOR_INFO,
        ...PROJECTED_ASSIGNED_USER_INFO,
      },
    },
  ]);

export const getAvailablePropertyOptions = async () =>
  Property.aggregate([
    {
      $group: {
        _id: null,
        houseTypes: { $addToSet: '$houseType' },
        states: { $addToSet: '$address.state' },
      },
    },
  ]);

export const getPropertiesWithPaymentPlanId = async (id) =>
  Property.find({ paymentPlan: { $in: [id] } });

export const getTotalAmountPaidForProperty = async (offerId) =>
  Transaction.aggregate([
    { $match: { offerId: ObjectId(offerId) } },
    {
      $lookup: {
        from: 'properties',
        localField: 'propertyId',
        foreignField: '_id',
        as: 'property',
      },
    },
    {
      $unwind: '$property',
    },
    {
      $group: {
        _id: '$property._id',
        totalAmountContributed: { $sum: '$amount' },
      },
    },
  ]);

export const getAssignedPropertyByOfferId = async (offerId) => {
  const total = await getTotalAmountPaidForProperty(offerId);
  const totalPaid = total.length > 0 ? total[0].totalAmountContributed : 0;

  const offer = await getOffer(offerId);

  return {
    totalPaid,
    offer: offer[0],
  };
};

export const getAssignedProperties = async (userId) =>
  Offer.aggregate([
    { $match: { userId: ObjectId(userId) } },
    {
      $match: {
        $or: [
          { status: OFFER_STATUS.ASSIGNED },
          { status: OFFER_STATUS.ALLOCATED },
          { status: OFFER_STATUS.INTERESTED },
        ],
      },
    },
    {
      $lookup: {
        from: 'properties',
        localField: 'propertyId',
        foreignField: '_id',
        as: 'property',
      },
    },
    {
      $unwind: '$property',
    },
  ]);
