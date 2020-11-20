import {
  addContentProperty,
  updateContentProperty,
  deleteContentProperty,
  getHouseTypesByAreaId,
  getPropertiesByParameters,
  getAllContentProperties,
} from '../services/contentProperty.service';
import httpStatus from '../helpers/httpStatus';

const ContentPropertyController = {
  add(req, res, next) {
    const contentProperty = req.locals;
    addContentProperty(contentProperty)
      .then((property) => {
        res
          .status(httpStatus.CREATED)
          .json({ success: true, message: 'Content property added successfully', property });
      })
      .catch((error) => next(error));
  },

  update(req, res, next) {
    const updatedContentProperty = req.locals;
    updateContentProperty(updatedContentProperty)
      .then((property) => {
        res
          .status(httpStatus.OK)
          .json({ success: true, message: 'Content property updated', property });
      })
      .catch((error) => next(error));
  },

  delete(req, res, next) {
    const { id } = req.params;
    deleteContentProperty(id)
      .then(() => {
        res.status(httpStatus.OK).json({ success: true, message: 'Content property deleted' });
      })
      .catch((error) => next(error));
  },

  getHouseTypesByAreaId(req, res, next) {
    const areaId = req.params.id;
    getHouseTypesByAreaId(areaId)
      .then((houseTypes) => {
        res.status(httpStatus.OK).json({ success: true, houseTypes });
      })
      .catch((error) => next(error));
  },

  search(req, res, next) {
    const { areaId, houseType } = req.query;
    getPropertiesByParameters({ areaId, houseType })
      .then((evaluation) => {
        res.status(httpStatus.OK).json({ success: true, evaluation });
      })
      .catch((error) => next(error));
  },

  getAllContentProperties(req, res, next) {
    const { page, limit } = req.query;
    getAllContentProperties(page, limit)
      .then(({ result, pagination }) => {
        res.status(httpStatus.OK).json({ success: true, pagination, result });
      })
      .catch((error) => next(error));
  },
};

export default ContentPropertyController;
