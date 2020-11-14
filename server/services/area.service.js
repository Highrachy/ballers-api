import Area from '../models/area.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';

export const getAreaById = async (id) => Area.findById(id).select();

export const addArea = async (area) => {
  try {
    const addedArea = await new Area(area).save();
    return addedArea;
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error adding area', error);
  }
};

export const getStateAndArea = async (state) => {
  if (!state) {
    const states = await Area.distinct('state');
    return { states };
  }
  const areas = await Area.find({ state });
  const area = [];
  areas.forEach((a) => {
    area.push({ [a.area]: a._id });
  });
  return { areas: area };
};
