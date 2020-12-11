import mongoose from 'mongoose';
import ContentProperty from '../models/contentProperty.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
// eslint-disable-next-line import/no-cycle
import { getAreaById, getAreaByAreaAndStateName } from './area.service';
import { generatePagination, generateFacetData, getPaginationTotal } from '../helpers/pagination';

const { ObjectId } = mongoose.Types.ObjectId;

export const getContentPropertyById = async (id) => ContentProperty.findById(id).select();

export const getContentPropertyByAreaId = async (areaId) =>
  ContentProperty.find({ areaId }).select();

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

export const getPropertiesByParameters = async ({ area, state, houseType }) => {
  if (!state || !area) {
    throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, 'Invalid state or area');
  }

  const areaExists = await getAreaByAreaAndStateName(area, state).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (areaExists.length < 1) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Area not found');
  }

  const areaId = areaExists[0]._id;

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
        maximumPrice: { $max: '$price' },
        averagePrice: { $avg: '$price' },
      },
    },
  ]);

  return {
    ...prices[0],
    type: houseType,
    areaName: areaExists[0].area,
    stateName: areaExists[0].state,
    longitude: areaExists[0].longitude,
    latitude: areaExists[0].latitude,
  };
};

export const getAllContentProperties = async (page = 1, limit = 10) => {
  const properties = await ContentProperty.aggregate([
    {
      $lookup: {
        from: 'areas',
        localField: 'areaId',
        foreignField: '_id',
        as: 'areaInfo',
      },
    },
    {
      $unwind: '$areaInfo',
    },
    {
      $facet: {
        metadata: [{ $count: 'total' }, { $addFields: { page, limit } }],
        data: generateFacetData(page, limit),
      },
    },
  ]);

  const total = getPaginationTotal(properties);
  const pagination = generatePagination(page, limit, total);
  return { pagination, result: properties[0].data };
};

export const getOneContentProperty = async (propertyId) =>
  ContentProperty.aggregate([
    { $match: { _id: ObjectId(propertyId) } },
    {
      $lookup: {
        from: 'areas',
        localField: 'areaId',
        foreignField: '_id',
        as: 'area',
      },
    },
    {
      $unwind: '$area',
    },
  ]);
