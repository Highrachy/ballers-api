import getAllModels from '../services/model.service';
import httpStatus from '../helpers/httpStatus';

const ModelController = {
  getAllModels(req, res, next) {
    const { user } = req;
    getAllModels(user)
      .then((models) => {
        res.status(httpStatus.OK).json({ success: true, models });
      })
      .catch((error) => next(error));
  },
};

export default ModelController;
