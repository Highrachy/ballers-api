import mongoose from 'mongoose';
import Area from '../models/area.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
// eslint-disable-next-line import/no-cycle
import { getContentPropertyByAreaId } from './contentProperty.service';
import { generatePagination, generateFacetData, getPaginationTotal } from '../helpers/pagination';
import { buildFilterAndSortQuery, AREA_FILTERS } from '../helpers/filters';

const { ObjectId } = mongoose.Types.ObjectId;

export const getAreaById = async (id) => Area.findById(id).select();

export const getAreaByAreaAndStateName = async (areaName, stateName) =>
  Area.find({ area: areaName, state: stateName }).collation({ locale: 'en', strength: 2 });

export const addArea = async (area) => {
  const areaExists = await getAreaByAreaAndStateName(area.area, area.state);

  if (areaExists.length > 0) {
    throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, 'Area already exists');
  }
  try {
    const addedArea = await new Area({
      ...area,
      area: area.area,
      state: area.state,
    }).save();
    return addedArea;
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error adding area', error);
  }
};

export const getStates = async () => {
  const states = await Area.distinct('state');
  return { states };
};

export const getAreasByState = async ({ state, tokenIsPresent }) => {
  const linkedProperties = await Area.aggregate([
    { $match: { state } },
    {
      $lookup: {
        from: 'contentproperties',
        localField: '_id',
        foreignField: 'areaId',
        as: 'linkedProperties',
      },
    },
  ]).collation({ locale: 'en', strength: 2 });

  const areas = linkedProperties.reduce((acc, area) => {
    if (tokenIsPresent || area.linkedProperties.length > 0) {
      acc.push({ _id: area._id, area: area.area });
    }
    return acc;
  }, []);

  return { areas };
};

export const updateArea = async (updatedArea) => {
  const area = await getAreaById(updatedArea.id).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });
  if (!area) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Area not found');
  }

  const areaPayload = {
    ...updatedArea,
    area: updatedArea.area ? updatedArea.area : area.area,
    state: updatedArea.state ? updatedArea.state : area.state,
  };

  try {
    return Area.findByIdAndUpdate(area.id, areaPayload, { new: true });
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error updating area', error);
  }
};

export const deleteArea = async (id) => {
  const area = await getAreaById(id).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (!area) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Area not found');
  }

  const attachedProperties = await getContentPropertyByAreaId(id).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (attachedProperties.length > 0) {
    throw new ErrorHandler(
      httpStatus.PRECONDITION_FAILED,
      `Area is linked to ${attachedProperties.length} content ${
        attachedProperties.length > 1 ? 'properties' : 'property'
      }`,
    );
  }

  try {
    return Area.findByIdAndDelete(area.id);
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error deleting area', error);
  }
};

export const getAllAreas = async ({ page = 1, limit = 10, ...query } = {}) => {
  const { filterQuery, sortQuery } = buildFilterAndSortQuery(AREA_FILTERS, query);

  const areaOptions = [
    { $match: { $and: filterQuery } },
    { $sort: sortQuery },
    {
      $lookup: {
        from: 'contentproperties',
        localField: '_id',
        foreignField: 'areaId',
        as: 'linkedProperties',
      },
    },
    { $sort: { area: 1 } },
    {
      $project: {
        _id: 1,
        state: '$state',
        area: '$area',
        longitude: '$longitude',
        latitude: '$latitude',
        numOfProperties: { $size: '$linkedProperties' },
        minimumPrice: { $min: '$linkedProperties.price' },
        maximumPrice: { $max: '$linkedProperties.price' },
        averagePrice: { $avg: '$linkedProperties.price' },
      },
    },
    {
      $facet: {
        metadata: [{ $count: 'total' }, { $addFields: { page, limit } }],
        data: generateFacetData(page, limit),
      },
    },
  ];

  if (Object.keys(sortQuery).length === 0) {
    areaOptions.splice(1, 1);
  }

  if (filterQuery.length < 1) {
    areaOptions.shift();
  }

  const areas = await Area.aggregate(areaOptions);

  const total = getPaginationTotal(areas);
  const pagination = generatePagination(page, limit, total);
  return { pagination, result: areas[0].data };
};

export const getAreaAndContentPropertiesByAreaId = async (areaId) =>
  Area.aggregate([
    { $match: { _id: ObjectId(areaId) } },
    {
      $lookup: {
        from: 'contentproperties',
        localField: '_id',
        foreignField: 'areaId',
        as: 'linkedProperties',
      },
    },
    { $sort: { area: 1 } },
    {
      $project: {
        _id: 1,
        state: '$state',
        area: '$area',
        longitude: '$longitude',
        latitude: '$latitude',
        numOfProperties: { $size: '$linkedProperties' },
        minimumPrice: { $min: '$linkedProperties.price' },
        maximumPrice: { $max: '$linkedProperties.price' },
        averagePrice: { $avg: '$linkedProperties.price' },
        linkedProperties: 1,
      },
    },
  ]);
