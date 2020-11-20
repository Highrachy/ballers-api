import Area from '../models/area.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
// eslint-disable-next-line import/no-cycle
import { getContentPropertyByAreaId } from './contentProperty.service';

export const getAreaById = async (id) => Area.findById(id).select();

export const getAreaByAreaName = async (areaName, stateName) =>
  Area.find({ area: areaName.toLowerCase(), state: stateName.toLowerCase() }).select();

export const addArea = async (area) => {
  const areaExists = await getAreaByAreaName(area.area, area.state);

  if (areaExists.length > 0) {
    throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, 'Area already exists');
  }
  try {
    const addedArea = await new Area({
      ...area,
      area: area.area.toLowerCase(),
      state: area.state.toLowerCase(),
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

export const getAreas = async (state) => {
  const areas = await Area.find({ state }).select('area');
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
    area: updatedArea.area ? updatedArea.area.toLowerCase() : area.area,
    state: updatedArea.state ? updatedArea.state.toLowerCase() : area.state,
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

export const getAllAreas = async () => {
  return Area.aggregate([
    {
      $lookup: {
        from: 'contentproperties',
        localField: '_id',
        foreignField: 'areaId',
        as: 'linkedProperties',
      },
    },
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
  ]);
};
