import mongoose from 'mongoose';
import Badge from '../models/badge.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
import { generatePagination, generateFacetData, getPaginationTotal } from '../helpers/pagination';
import { buildFilterAndSortQuery, BADGE_FILTERS } from '../helpers/filters';
// eslint-disable-next-line import/no-cycle
import { getAssignedBadgesByBadgeId } from './assignedBadge.service';
import { PROJECTED_BADGE_INFO, NON_PROJECTED_USER_INFO } from '../helpers/projectedSchemaInfo';
import { slugify } from '../helpers/funtions';
import { BADGE_ACCESS_LEVEL } from '../helpers/constants';

const { ObjectId } = mongoose.Types.ObjectId;

export const getBadgeById = async (id) => Badge.findById(id).select();

export const getBadgeBySlug = async (badgeSlug) =>
  Badge.find({ slug: badgeSlug }).collation({ locale: 'en', strength: 2 });

export const addBadge = async (badge) => {
  const slug = slugify(badge.name);

  const badgeExists = await getBadgeBySlug(slug);

  if (badgeExists.length > 0) {
    throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, 'Badge already exists');
  }

  try {
    const addedBadge = await new Badge({ ...badge, slug }).save();
    return addedBadge;
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error adding badge', error);
  }
};

export const updateBadge = async (updatedBadge) => {
  const badge = await getBadgeById(updatedBadge.id).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });
  if (!badge) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Badge not found');
  }

  const badgePayload = {
    ...badge.toObject(),
    ...updatedBadge,
  };

  try {
    return Badge.findByIdAndUpdate(badge._id, badgePayload, { new: true });
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error updating badge', error);
  }
};

export const deleteBadge = async (id) => {
  const badge = await getBadgeById(id).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (!badge) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Badge not found');
  }

  const attachedUsers = await getAssignedBadgesByBadgeId(badge._id).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (attachedUsers.length > 0) {
    throw new ErrorHandler(
      httpStatus.PRECONDITION_FAILED,
      `Badge has been assigned to ${attachedUsers.length} ${
        attachedUsers.length > 1 ? 'users' : 'user'
      }`,
    );
  }

  try {
    return Badge.findByIdAndDelete(badge._id);
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error deleting badge', error);
  }
};

export const getAllBadges = async ({ page = 1, limit = 10, ...query } = {}) => {
  const { filterQuery, sortQuery } = buildFilterAndSortQuery(BADGE_FILTERS, query);

  const badgeOptions = [
    { $match: { $and: filterQuery } },
    { $sort: sortQuery },
    {
      $lookup: {
        from: 'assignedbadges',
        localField: '_id',
        foreignField: 'badgeId',
        as: 'assignedBadges',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'assignedBadges.userId',
        foreignField: '_id',
        as: 'assignedUsers',
      },
    },
    {
      $project: {
        ...PROJECTED_BADGE_INFO,
        noOfAssignedUsers: { $size: '$assignedUsers' },
      },
    },
    {
      $facet: {
        metadata: [{ $count: 'total' }, { $addFields: { page, limit } }],
        data: generateFacetData(page, limit),
      },
    },
  ];

  if (Object.keys(sortQuery).length === 0) {
    badgeOptions.splice(1, 1);
  }

  if (filterQuery.length < 1) {
    badgeOptions.shift();
  }

  const badges = await Badge.aggregate(badgeOptions);

  const total = getPaginationTotal(badges);
  const pagination = generatePagination(page, limit, total);
  return { pagination, result: badges[0].data };
};

export const getOneBadge = async (badgeId) => {
  const badge = await Badge.aggregate([
    { $match: { _id: ObjectId(badgeId) } },
    {
      $lookup: {
        from: 'assignedbadges',
        localField: '_id',
        foreignField: 'badgeId',
        as: 'assignedBadges',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'assignedBadges.userId',
        foreignField: '_id',
        as: 'assignedUsers',
      },
    },
    {
      $project: {
        assignedBadges: 0,
        ...NON_PROJECTED_USER_INFO('assignedUsers'),
      },
    },
  ]);

  if (badge.length === 0) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Badge not found');
  }

  return badge[0];
};

export const getAllAndRoleSpecificBadges = (assignedRole) => {
  return Badge.aggregate([
    { $match: { automated: false } },
    {
      $match: {
        $and: [{ automated: BADGE_ACCESS_LEVEL.ALL }, { automated: parseInt(assignedRole, 10) }],
      },
    },
  ]);
};
