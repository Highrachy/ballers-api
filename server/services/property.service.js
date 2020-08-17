import Property from '../models/property.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';

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

export const getAllProperties = async () => Property.find();

export const searchThroughProperties = async (filter) =>
  Property.aggregate([
    {
      $match: {
        $and: [
          { houseType: filter.houseType },
          { location: filter.location },
          { price: { $gte: filter.minPrice, $lte: filter.maxPrice } },
        ],
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'assignedTo',
        foreignField: '_id',
        as: 'assignedTo',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'addedBy',
        foreignField: '_id',
        as: 'addedBy',
      },
    },
    {
      $unwind: '$addedBy',
    },
    {
      $project: {
        _id: 1,
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
        'assignedTo._id': 1,
        'assignedTo.firstName': 1,
        'assignedTo.lastName': 1,
        'assignedTo.email': 1,
        'addedBy._id': 1,
        'addedBy.firstName': 1,
        'addedBy.lastName': 1,
        'addedBy.email': 1,
      },
    },
  ]);
