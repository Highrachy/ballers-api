import Visitation from '../models/visitation.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
import { getPropertyById } from './property.service';

export const scheduleVisitation = async (schedule) => {
  const property = await getPropertyById(schedule.propertyId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });
  if (property) {
    try {
      const newSchedule = await new Visitation(schedule).save();
      return newSchedule;
    } catch (error) {
      throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error scheduling visit', error);
    }
  } else {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Property not found');
  }
};

export const getAllVisitations = async () =>
  Visitation.aggregate([
    {
      $lookup: {
        from: 'properties',
        localField: 'propertyId',
        foreignField: '_id',
        as: 'propertyInfo',
      },
    },
    {
      $project: {
        'propertyInfo.assignedTo': 0,
      },
    },
  ]);
