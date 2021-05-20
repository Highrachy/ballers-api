import getTotalCount from '../services/totalCount.service';
import httpStatus from '../helpers/httpStatus';

const TotalCountController = {
  getTotalCount(req, res, next) {
    const { user } = req;
    getTotalCount(user)
      .then((models) => {
        res.status(httpStatus.OK).json({ success: true, models });
      })
      .catch((error) => next(error));
  },
};

export default TotalCountController;
