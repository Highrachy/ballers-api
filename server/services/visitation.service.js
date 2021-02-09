import mongoose from 'mongoose';
import Visitation from '../models/visitation.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
import { getPropertyById } from './property.service';
import { getUserById } from './user.service';
import { USER_ROLE, VISITATION_STATUS } from '../helpers/constants';
import { generatePagination, generateFacetData, getPaginationTotal } from '../helpers/pagination';
import { getDateWithTimestamp } from '../helpers/dates';

const { ObjectId } = mongoose.Types.ObjectId;

export const getVisitationById = async (id) => Visitation.findById(id).select();

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

export const resolveVisitation = async ({ visitationId, vendorId }) => {
  const visitation = await getVisitationById(visitationId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (!visitation) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Visitation not found');
  }
  if (visitation.vendorId.toString() !== vendorId.toString()) {
    throw new ErrorHandler(httpStatus.FORBIDDEN, 'You are not permitted to perform this action');
  }

  try {
    return Visitation.findByIdAndUpdate(
      visitation.id,
      { $set: { status: VISITATION_STATUS.RESOLVED } },
      { new: true },
    );
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error resolving visitation', error);
  }
};

export const rescheduleVisitation = async ({ user, visitationInfo }) => {
  let mailDetails;
  const visitation = await getVisitationById(visitationInfo.visitationId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (!visitation) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Visitation not found');
  }
  if (
    (user.role === USER_ROLE.VENDOR && visitation.vendorId.toString() !== user._id.toString()) ||
    (user.role === USER_ROLE.USER && visitation.userId.toString() !== user._id.toString())
  ) {
    throw new ErrorHandler(httpStatus.FORBIDDEN, 'You are not permitted to perform this action');
  }

  if (visitation.status === VISITATION_STATUS.RESOLVED) {
    throw new ErrorHandler(
      httpStatus.PRECONDITION_FAILED,
      'You cannot reschedule a resolved visitation',
    );
  }

  if (user.role === USER_ROLE.VENDOR) {
    mailDetails = await getUserById(visitation.userId);
  } else {
    mailDetails = await getUserById(visitation.vendorId);
  }
  const property = await getPropertyById(visitation.propertyId);

  const rescheduleLog = [
    {
      reason: visitationInfo.reason,
      rescheduleFrom: visitation.visitDate,
      rescheduleTo: visitationInfo.visitDate,
      date: getDateWithTimestamp(),
      rescheduleBy: user._id,
    },
    ...visitation.rescheduleLog,
  ];

  try {
    const rescheduledVisitation = await Visitation.findByIdAndUpdate(
      visitation.id,
      { $set: { visitDate: visitationInfo.visitDate, rescheduleLog } },
      { new: true },
    );

    return { visitation: rescheduledVisitation, mailDetails, property };
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error rescheduling visitation', error);
  }
};
