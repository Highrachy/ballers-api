import mongoose from 'mongoose';
import Property from '../models/property.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';

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
    return Property.findByIdAndUpdate(property.id, updatedProperty, { new: true });
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error updating property', error);
  }
};

export const deleteProperty = async (id) => {
  const property = await getPropertyById(id).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });
  try {
    return Property.findByIdAndDelete(property.id);
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error deleting property', error);
  }
};

// get properties added by a specific admin with the info of assigned users attached
export const getAllPropertiesAddedByAnAdmin = async (adminId) =>
  Property.aggregate([
    { $match: { addedBy: ObjectId(adminId) } },
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
        neighborhood: 1,
        gallery: 1,
        name: 1,
        location: 1,
        price: 1,
        units: 1,
        houseType: 1,
        bedrooms: 1,
        toilets: 1,
        description: 1,
        paymentPlan: 1,
        'assignedUsers._id': 1,
        'assignedUsers.firstName': 1,
        'assignedUsers.lastName': 1,
        'assignedUsers.email': 1,
      },
    },
  ]);

// get all properties in the database with the assigned user and admin details
export const getAllProperties = async () =>
  Property.aggregate([
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
        as: 'adminInfo',
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
      $unwind: '$adminInfo',
    },
    {
      $project: {
        neighborhood: 1,
        gallery: 1,
        name: 1,
        location: 1,
        price: 1,
        units: 1,
        houseType: 1,
        bedrooms: 1,
        toilets: 1,
        description: 1,
        paymentPlan: 1,
        'assignedUsers._id': 1,
        'assignedUsers.firstName': 1,
        'assignedUsers.lastName': 1,
        'assignedUsers.email': 1,
        'adminInfo._id': 1,
        'adminInfo.firstName': 1,
        'adminInfo.lastName': 1,
        'adminInfo.email': 1,
      },
    },
  ]);

// get a property by its id and admin details
export const getOneProperty = async (propertId) =>
  Property.aggregate([
    { $match: { _id: ObjectId(propertId) } },
    {
      $lookup: {
        from: 'users',
        localField: 'addedBy',
        foreignField: '_id',
        as: 'adminInfo',
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
      $unwind: '$adminInfo',
    },
    {
      $project: {
        neighborhood: 1,
        gallery: 1,
        name: 1,
        location: 1,
        price: 1,
        units: 1,
        houseType: 1,
        bedrooms: 1,
        toilets: 1,
        description: 1,
        paymentPlan: 1,
        'adminInfo._id': 1,
        'adminInfo.firstName': 1,
        'adminInfo.lastName': 1,
        'adminInfo.email': 1,
      },
    },
  ]);

export const getPropertiesWithPaymentPlanId = async (id) =>
  Property.find({ paymentPlan: { $in: [id] } });
