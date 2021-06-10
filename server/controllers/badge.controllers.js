import { addBadge, updateBadge, deleteBadge, getAllBadges } from '../services/badge.service';
import httpStatus from '../helpers/httpStatus';

const BadgeController = {
  addBadge(req, res, next) {
    const badgeInfo = req.locals;
    addBadge({ ...badgeInfo, addedBy: req.user._id })
      .then((badge) => {
        res
          .status(httpStatus.CREATED)
          .json({ success: true, message: 'Badge added successfully', badge });
      })
      .catch((error) => next(error));
  },

  updateBadge(req, res, next) {
    const updatedBadge = req.locals;
    updateBadge(updatedBadge)
      .then((badge) => {
        res.status(httpStatus.OK).json({ success: true, message: 'Badge updated', badge });
      })
      .catch((error) => next(error));
  },

  deleteBadge(req, res, next) {
    const { id } = req.params;
    deleteBadge(id)
      .then(() => {
        res.status(httpStatus.OK).json({ success: true, message: 'Badge deleted' });
      })
      .catch((error) => next(error));
  },

  getAllBadges(req, res, next) {
    const { query } = req;
    getAllBadges(query)
      .then(({ result, pagination }) => {
        res.status(httpStatus.OK).json({ success: true, pagination, result });
      })
      .catch((error) => next(error));
  },
};

export default BadgeController;
