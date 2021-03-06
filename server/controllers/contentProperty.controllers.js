import {
  addContentProperty,
  updateContentProperty,
  deleteContentProperty,
  getHouseTypesByAreaId,
  getPropertiesByParameters,
  getAllContentProperties,
  getOneContentProperty,
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
    const { area, state, houseType } = req.query;
    getPropertiesByParameters({ area, state, houseType })
      .then((evaluation) => {
        res.status(httpStatus.OK).json({ success: true, evaluation });
      })
      .catch((error) => next(error));
  },

  getAllContentProperties(req, res, next) {
    const { query } = req;
    getAllContentProperties(query)
      .then(({ result, pagination }) => {
        res.status(httpStatus.OK).json({ success: true, pagination, result });
      })
      .catch((error) => next(error));
  },

  getContentPropertyById(req, res, next) {
    const { id } = req.params;
    getOneContentProperty(id)
      .then((property) => {
        if (property.length > 0) {
          res.status(httpStatus.OK).json({ success: true, property: property[0] });
        } else {
          res.status(httpStatus.NOT_FOUND).json({ success: false, message: 'Property not found' });
        }
      })
      .catch((error) => next(error));
  },
};

export default ContentPropertyController;
