import ContentProperty from '../models/contentProperty.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
// eslint-disable-next-line import/no-cycle
import { getAreaById } from './area.service';
import generatePagination from '../helpers/pagination';

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

export const getAllProperties = async (page = 1, limit = 10) => {
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
        data: [{ $skip: parseInt((page - 1) * limit, 10) }, { $limit: parseInt(limit, 10) }],
      },
    },
  ]);

  const { total } = properties[0].metadata[0];
  const pagination = generatePagination(page, limit, total);
  return { pagination, result: properties[0].data };
};
