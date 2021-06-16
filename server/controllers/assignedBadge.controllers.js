import {
  assignBadge,
  deleteAssignedBadge,
  getAssignedBadge,
  getAllAssignedBadges,
} from '../services/assignedBadge.service';
import httpStatus from '../helpers/httpStatus';

const AssignedBadgeController = {
  assignBadge(req, res, next) {
    const badgeInfo = req.locals;
    assignBadge({ ...badgeInfo, assignedBy: req.user._id })
      .then((assignedBadge) => {
        res
          .status(httpStatus.CREATED)
          .json({ success: true, message: 'Badge assigned successfully', assignedBadge });
      })
      .catch((error) => next(error));
  },

  deleteAssignedBadge(req, res, next) {
    const { id } = req.params;
    deleteAssignedBadge(id)
      .then(() => {
        res.status(httpStatus.OK).json({ success: true, message: 'Assigned badge deleted' });
      })
      .catch((error) => next(error));
  },

  getAllAssignedBadges(req, res, next) {
    const { query, user } = req;
    getAllAssignedBadges(user, query)
      .then(({ result, pagination }) => {
        res.status(httpStatus.OK).json({ success: true, pagination, result });
      })
      .catch((error) => next(error));
  },

  getAssignedBadge(req, res, next) {
    const { id } = req.params;
    const { user } = req;
    getAssignedBadge(user, id)
      .then((assignedBadge) => {
        res.status(httpStatus.OK).json({ success: true, assignedBadge });
      })
      .catch((error) => next(error));
  },
};

export default AssignedBadgeController;
