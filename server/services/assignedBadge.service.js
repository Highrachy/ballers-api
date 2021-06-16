import mongoose from 'mongoose';
import AssignedBadge from '../models/assignedBadge.model';
import { getUserById } from './user.service';
// eslint-disable-next-line import/no-cycle
import { getBadgeById } from './badge.service';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
import { generatePagination, generateFacetData, getPaginationTotal } from '../helpers/pagination';
import { buildFilterAndSortQuery, ASSIGNED_BADGE_FILTERS } from '../helpers/filters';
import { USER_ROLE, BADGE_ACCESS_LEVEL } from '../helpers/constants';
import { NON_PROJECTED_USER_INFO } from '../helpers/projectedSchemaInfo';

const { ObjectId } = mongoose.Types.ObjectId;

export const getAssignedBadgeById = async (id) => AssignedBadge.findById(id).select();

export const getAssignedBadgesByBadgeId = async (badgeId) =>
  AssignedBadge.find({ badgeId }).select();

export const assignBadge = async (badgeInfo) => {
  const badge = await getBadgeById(badgeInfo.badgeId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });
  if (!badge) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Badge not found');
  }

  const user = await getUserById(badgeInfo.userId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });
  if (!user) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'User not found');
  }

  if (badge.assignedRole !== BADGE_ACCESS_LEVEL.ALL && badge.assignedRole !== user.role) {
    throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, 'Badge cannot be assigned to user');
  }

  try {
    const assignedBadge = await new AssignedBadge(badgeInfo).save();

    return assignedBadge;
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error assigning badge', error);
  }
};

export const deleteAssignedBadge = async (id) => {
  const assignedBadge = await getAssignedBadgeById(id).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (!assignedBadge) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Assigned badge not found');
  }

  try {
    return AssignedBadge.findByIdAndDelete(assignedBadge._id);
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error deleting assigned badge', error);
  }
};

export const getAssignedBadge = async (user, assignedBadgeId) => {
  const assignedBadgeOptions = [
    { $match: { _id: ObjectId(assignedBadgeId) } },
    {
      $lookup: {
        from: 'badges',
        localField: 'badgeId',
        foreignField: '_id',
        as: 'badgeInfo',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'userInfo',
      },
    },
    { $unwind: '$badgeInfo' },
    { $unwind: '$userInfo' },
    { $project: NON_PROJECTED_USER_INFO('userInfo') },
  ];

  if (user.role !== USER_ROLE.ADMIN) {
    assignedBadgeOptions.unshift({ $match: { userId: ObjectId(user._id) } });
  }
  const assignedBadge = await AssignedBadge.aggregate(assignedBadgeOptions);

  if (assignedBadge.length === 0) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Assigned badge not found');
  }

  return assignedBadge[0];
};

export const getAllAssignedBadges = async (user, { page = 1, limit = 10, ...query } = {}) => {
  const { filterQuery, sortQuery } = buildFilterAndSortQuery(ASSIGNED_BADGE_FILTERS, query);

  const assignedBadgeOptions = [
    { $match: { $and: filterQuery } },
    { $sort: sortQuery },
    {
      $lookup: {
        from: 'badges',
        localField: 'badgeId',
        foreignField: '_id',
        as: 'badgeInfo',
      },
    },
    { $unwind: '$badgeInfo' },
    {
      $facet: {
        metadata: [{ $count: 'total' }, { $addFields: { page, limit } }],
        data: generateFacetData(page, limit),
      },
    },
  ];

  if (Object.keys(sortQuery).length === 0) {
    assignedBadgeOptions.splice(1, 1);
  }

  if (filterQuery.length < 1) {
    assignedBadgeOptions.shift();
  }

  if (user.role !== USER_ROLE.ADMIN) {
    assignedBadgeOptions.unshift({ $match: { userId: ObjectId(user._id) } });
  }

  const assignedBadges = await AssignedBadge.aggregate(assignedBadgeOptions);

  const total = getPaginationTotal(assignedBadges);
  const pagination = generatePagination(page, limit, total);
  return { pagination, result: assignedBadges[0].data };
};
