import AssignedBadge from '../models/assignedBadge.model';

export const getAssignedBadgeById = async (id) => AssignedBadge.findById(id).select();

export const getAssignedBadgesByBadgeId = async (badgeId) =>
  AssignedBadge.find({ badgeId }).select();
