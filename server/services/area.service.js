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
