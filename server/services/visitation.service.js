import mongoose from 'mongoose';
import Visitation from '../models/visitation.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
import { getPropertyById } from './property.service';
import { getUserById } from './user.service';
import { USER_ROLE } from '../helpers/constants';
import { generatePagination, generateFacetData, getPaginationTotal } from '../helpers/pagination';

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

export const getAllVisitations = async (user, page = 1, limit = 10) => {
  const scheduleOptions = [
    {
      $lookup: {
        from: 'properties',
        localField: 'propertyId',
        foreignField: '_id',
        as: 'propertyInfo',
      },
    },
    {
      $facet: {
        metadata: [{ $count: 'total' }, { $addFields: { page, limit } }],
        data: generateFacetData(page, limit),
      },
    },
  ];

  if (user.role === USER_ROLE.VENDOR) {
    scheduleOptions.unshift({ $match: { vendorId: ObjectId(user._id) } });
  }

  const schedules = await Visitation.aggregate(scheduleOptions);

  const total = getPaginationTotal(schedules);
  const pagination = generatePagination(page, limit, total);
  const result = schedules[0].data;
  return { pagination, result };
};
