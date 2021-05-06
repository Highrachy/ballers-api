import mongoose from 'mongoose';
import Visitation from '../models/visitation.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
import { getPropertyById } from './property.service';
import { getUserById } from './user.service';
import { USER_ROLE, VISITATION_STATUS, PROCESS_VISITATION_ACTION } from '../helpers/constants';
import { generatePagination, generateFacetData, getPaginationTotal } from '../helpers/pagination';
import { getDateWithTimestamp } from '../helpers/dates';
import { buildFilterQuery, VISITATION_FILTERS } from '../helpers/filters';
import { createNotification } from './notification.service';
import NOTIFICATIONS from '../helpers/notifications';

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

      const descriptionVendor = `A new propery visit has been requested for ${property.name}`;
      await createNotification(NOTIFICATIONS.SCHEDULE_VISIT_VENDOR, vendor._id, {
        description: descriptionVendor,
      });

      const descriptionUser = `Your visitation to ${property.name} has been scheduled for ${schedule.visitDate}`;
      await createNotification(NOTIFICATIONS.SCHEDULE_VISIT_USER, schedule.userId, {
        description: descriptionUser,
      });

      return { schedule: newSchedule, vendor };
    } catch (error) {
      throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error scheduling visit', error);
    }
  } else {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Property not found');
  }
};

export const getAllVisitations = async (user, { page = 1, limit = 10, ...query } = {}) => {
  const filterQuery = buildFilterQuery(VISITATION_FILTERS, query);

  const scheduleOptions = [
    { $match: { $and: filterQuery } },
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

  if (filterQuery.length < 1) {
    scheduleOptions.shift();
  }

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

export const processVisitation = async ({ user, visitationInfo, action }) => {
  let mailDetails;
  let processedVisitation;
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
      'The visitation has already been resolved',
    );
  }

  if (visitation.status === VISITATION_STATUS.CANCELLED) {
    throw new ErrorHandler(
      httpStatus.PRECONDITION_FAILED,
      'The visitation has already been cancelled',
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
      rescheduleFrom: action === PROCESS_VISITATION_ACTION.RESCHEDULE ? visitation.visitDate : null,
      rescheduleTo: visitationInfo?.visitDate,
      date: getDateWithTimestamp(),
      rescheduleBy: user.role === USER_ROLE.VENDOR ? 'Vendor' : 'User',
    },
    ...visitation.rescheduleLog,
  ];

  if (action === PROCESS_VISITATION_ACTION.RESCHEDULE) {
    processedVisitation = { visitDate: visitationInfo.visitDate, rescheduleLog };
  } else {
    processedVisitation = { status: VISITATION_STATUS.CANCELLED, rescheduleLog };
  }

  try {
    const updatedVisitation = await Visitation.findByIdAndUpdate(
      visitation.id,
      { $set: processedVisitation },
      { new: true },
    );

    if (action === PROCESS_VISITATION_ACTION.RESCHEDULE) {
      const description = `Your visitation to ${property.name} for ${visitation.visitDate} has been rescheduled to ${visitationInfo?.visitDate}`;
      await createNotification(NOTIFICATIONS.RESCHEDULE_VISIT, mailDetails._id, { description });
    } else {
      const description = `Your visitation to ${property.name} for ${visitation.visitDate} has been cancelled`;
      await createNotification(NOTIFICATIONS.CANCEL_VISIT, mailDetails._id, { description });
    }

    return { visitation: updatedVisitation, mailDetails, property };
  } catch (error) {
    throw new ErrorHandler(
      httpStatus.BAD_REQUEST,
      `Error ${
        action === PROCESS_VISITATION_ACTION.CANCEL ? 'cancelling' : 'rescheduling'
      } visitation`,
      error,
    );
  }
};
