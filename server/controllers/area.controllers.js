import { addArea, getStates, getAreas, updateArea, deleteArea } from '../services/area.service';
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

  getStates(req, res, next) {
    getStates()
      .then((states) => {
        res.status(httpStatus.OK).json({ success: true, states: states.states });
      })
      .catch((error) => next(error));
  },

  getAreas(req, res, next) {
    const { state } = req.params;
    getAreas(state)
      .then((areas) => {
        res.status(httpStatus.OK).json({ success: true, areas: areas.areas });
      })
      .catch((error) => next(error));
  },

  update(req, res, next) {
    const updatedArea = req.locals;
    updateArea(updatedArea)
      .then((area) => {
        res.status(httpStatus.OK).json({ success: true, message: 'Area updated', area });
      })
      .catch((error) => next(error));
  },

  delete(req, res, next) {
    const { id } = req.params;
    deleteArea(id)
      .then(() => {
        res.status(httpStatus.OK).json({ success: true, message: 'Area deleted' });
      })
      .catch((error) => next(error));
  },
};

export default AreaController;
