import mongoose from 'mongoose';
import ContentProperty from '../models/contentProperty.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
import { getAreaById } from './area.service';

const { ObjectId } = mongoose.Types.ObjectId;

export const getContentPropertyById = async (id) => ContentProperty.findById(id).select();

export const addContentProperty = async (property) => {
  const area = await getAreaById(property.areaId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });
  if (area) {
    try {
      const newProperty = await new ContentProperty(property).save();
      return newProperty;
    } catch (error) {
      throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error adding content property', error);
    }
  } else {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Area not found');
  }
};

export const updateContentProperty = async (updatedContentProperty) => {
  const property = await getContentPropertyById(updatedContentProperty.id).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });
  if (!property) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Property not found');
  }
  if (updatedContentProperty.areaId) {
    const area = await getAreaById(updatedContentProperty.areaId).catch((error) => {
      throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
    });

    if (!area) {
      throw new ErrorHandler(httpStatus.NOT_FOUND, 'Area not found');
    }
  }
  try {
    return ContentProperty.findByIdAndUpdate(property.id, updatedContentProperty, { new: true });
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error updating content property', error);
  }
};

export const deleteContentProperty = async (id) => {
  const property = await getContentPropertyById(id).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (!property) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Property not found');
  }

  try {
    return ContentProperty.findByIdAndDelete(property.id);
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error deleting content property', error);
  }
};

export const getHouseTypesByAreaId = async (areaId) => {
  const area = await getAreaById(areaId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (!area) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Area not found');
  }
  return ContentProperty.find({ areaId }).distinct('houseType');
};

export const getPropertiesByParameters = async ({ areaId, houseType }) => {
  const area = await getAreaById(areaId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (!area) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Area not found');
  }

  const prices = await ContentProperty.aggregate([
    {
      $match: {
        $and: [{ houseType: houseType || /.*/ }, { areaId: ObjectId(areaId) || /.*/ }],
      },
    },
    {
      $group: {
        _id: '$category',
        minimumPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
        avgPrice: { $avg: '$price' },
      },
    },
  ]);

  return { ...prices[0], houseType, area: area.area };
};
