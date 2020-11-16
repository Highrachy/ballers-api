import { addArea, getState, getArea } from '../services/area.service';
import httpStatus from '../helpers/httpStatus';

const AreaController = {
  add(req, res, next) {
    const areaInfo = req.locals;
    addArea(areaInfo)
      .then((area) => {
        res
          .status(httpStatus.CREATED)
          .json({ success: true, message: 'Area added successfully', area });
      })
      .catch((error) => next(error));
  },

  getState(req, res, next) {
    getState()
      .then((states) => {
        res.status(httpStatus.OK).json({ success: true, states: states.states });
      })
      .catch((error) => next(error));
  },

  getArea(req, res, next) {
    const { state } = req.params;
    getArea(state)
      .then((areas) => {
        res.status(httpStatus.OK).json({ success: true, areas: areas.areas });
      })
      .catch((error) => next(error));
  },
};

export default AreaController;
