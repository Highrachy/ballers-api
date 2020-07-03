import Property from '../models/property.model';
import { ErrorHandler } from '../helpers/errorHandler';

export const getPropertyByRefNo = async (refNo) => Property.findOne({ refNo });

export const getPropertyById = async (id) => Property.findById(id);

export const getOwnedProperties = async (owner) => Property.find({ owner });

export const addProperty = async (property) => {
  const existingProperty = await getPropertyByRefNo(property.refNo).catch((error) => {
    throw new ErrorHandler(500, 'Internal Server Error', error);
  });
  if (existingProperty) {
    throw new ErrorHandler(412, 'Property already exists');
  }
  try {
    return new Property(property).save();
  } catch (error) {
    throw new ErrorHandler(400, 'Error adding property', error);
  }
};

export const updateProperty = async (updatedProperty) => {
  const property = await getPropertyByRefNo(updatedProperty.refNo).catch((error) => {
    throw new ErrorHandler(500, 'Internal Server Error', error);
  });
  try {
    return Property.findOneAndUpdate({ refNo: property.refNo }, updatedProperty);
  } catch (error) {
    throw new ErrorHandler(400, 'Error updating property', error);
  }
};

export const deleteProperty = async (refNo) => {
  const property = await getPropertyByRefNo(refNo).catch((error) => {
    throw new ErrorHandler(500, 'Internal Server Error', error);
  });
  return Property.findOneAndDelete({ refNo: property.refNo });
};
