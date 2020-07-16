import {
  addProperty,
  updateProperty,
  deleteProperty,
  getPropertyById,
  getAllProperties,
} from '../services/property.service';
import httpStatus from '../helpers/httpStatus';

const PropertyController = {
  add(req, res, next) {
    const newProperty = req.locals;
    const { user } = req;
    addProperty({ ...newProperty, addedBy: user._id, updatedBy: user._id })
      .then((property) => {
        res.status(httpStatus.CREATED).json({ success: true, message: 'Property added', property });
      })
      .catch((error) => next(error));
  },
  update(req, res, next) {
    const updatedproperty = req.locals;
    const { user } = req;
    updateProperty({ ...updatedproperty, updatedBy: user._id })
      .then(() => {
        res.status(httpStatus.OK).json({ success: true, message: 'Property updated' });
      })
      .catch((error) => next(error));
  },
  delete(req, res, next) {
    const { id } = req.params;
    deleteProperty(id)
      .then(() => {
        res.status(httpStatus.OK).json({ success: true, message: 'Property deleted' });
      })
      .catch((error) => next(error));
  },
  getMultiple(req, res, next) {
    getAllProperties()
      .then((properties) => {
        if (properties.length > 0) {
          res.status(httpStatus.OK).json({ success: true, properties });
        } else {
          res
            .status(httpStatus.NOT_FOUND)
            .json({ success: false, message: 'No properties available' });
        }
      })
      .catch((error) => next(error));
  },
  getOne(req, res, next) {
    getPropertyById(req.params.id)
      .then((property) => {
        if (property.length < 1) {
          res
            .status(httpStatus.NOT_FOUND)
            .json({ success: false, message: 'Property does not exist' });
        } else {
          res.status(httpStatus.OK).json({ success: true, property });
        }
      })
      .catch((error) => next(error));
  },
};

export default PropertyController;
