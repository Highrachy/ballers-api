import Area from '../models/area.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';

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

export const getState = async () => {
  const states = await Area.distinct('state');
  return { states };
};

export const getArea = async (state) => {
  const areas = await Area.find({ state }).select('area');
  return { areas };
};
