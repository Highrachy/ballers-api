import mongoose from 'mongoose';
import Visitation from '../models/visitation.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
import { getPropertyById } from './property.service';
import { getUserById } from './user.service';
import { USER_ROLE } from '../helpers/constants';

const { ObjectId } = mongoose.Types.ObjectId;

export const scheduleVisitation = async (schedule) => {
  const property = await getPropertyById(schedule.propertyId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (property) {
    const vendor = await getUserById(property.addedBy).catch((error) => {
      throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
    });

    try {
      const newSchedule = await new Visitation({ ...schedule, vendorId: property.addedBy }).save();
      return { schedule: newSchedule, vendor };
    } catch (error) {
      throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error scheduling visit', error);
    }
  } else {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Property not found');
  }
};

export const getAllVisitations = async (user) => {
  let schedules;

  if (user.role === USER_ROLE.VENDOR) {
    schedules = await Visitation.aggregate([
      { $match: { vendorId: ObjectId(user._id) } },
      {
        $lookup: {
          from: 'properties',
          localField: 'propertyId',
          foreignField: '_id',
          as: 'propertyInfo',
        },
      },
    ]);
  }
  if (user.role === USER_ROLE.ADMIN) {
    schedules = await Visitation.aggregate([
      {
        $lookup: {
          from: 'properties',
          localField: 'propertyId',
          foreignField: '_id',
          as: 'propertyInfo',
        },
      },
    ]);
  }

  return schedules;
};
