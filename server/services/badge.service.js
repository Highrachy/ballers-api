import Badge from '../models/badge.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
import { generatePagination, generateFacetData, getPaginationTotal } from '../helpers/pagination';
import { buildFilterAndSortQuery, BADGE_FILTERS } from '../helpers/filters';
import { getAssignedBadgesByBadgeId } from './assignedBadge.service';

export const getBadgeById = async (id) => Badge.findById(id).select();

export const addBadge = async (badge) => {
  try {
    const addedBadge = await new Badge({
      ...badge,
      dateAdded: Date.now(),
    }).save();
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
    ...updatedBadge,
    name: updatedBadge.name ? updatedBadge.name : badge.name,
    userLevel: updatedBadge.userLevel ? updatedBadge.userLevel : badge.userLevel,
  };

  try {
    return Badge.findByIdAndUpdate(badge._id, badgePayload, { new: true });
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error updating area', error);
  }
};

export const deleteBadge = async (id) => {
  const badge = await getBadgeById(id).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (!badge) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Badge not found');
  }

  const attachedUsers = await getAssignedBadgesByBadgeId().catch((error) => {
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
