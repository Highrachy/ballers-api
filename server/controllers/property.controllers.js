import {
  addProperty,
  updateProperty,
  deleteProperty,
  getAllPropertiesAddedByAnAdmin,
  getAllProperties,
  searchThroughProperties,
  getOneProperty,
  getAvailablePropertyOptions,
  getAssignedPropertyById,
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
      .then((property) => {
        res.status(httpStatus.OK).json({ success: true, message: 'Property updated', property });
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

  getAllPropertiesAddedByAnAdmin(req, res, next) {
    const adminId = req.params.id;
    getAllPropertiesAddedByAnAdmin(adminId)
      .then((properties) => {
        res.status(httpStatus.OK).json({ success: true, properties });
      })
      .catch((error) => next(error));
  },

  getAllProperties(req, res, next) {
    getAllProperties()
      .then((properties) => {
        res.status(httpStatus.OK).json({ success: true, properties });
      })
      .catch((error) => next(error));
  },

  getOneProperty(req, res, next) {
    const propertId = req.params.id;
    getOneProperty(propertId)
      .then((property) => {
        if (property.length > 0) {
          res.status(httpStatus.OK).json({ success: true, property });
        } else {
          res.status(httpStatus.NOT_FOUND).json({ success: false, message: 'Property not found' });
        }
      })
      .catch((error) => next(error));
  },
  search(req, res, next) {
    const filter = req.locals;
    searchThroughProperties(filter)
      .then((properties) => {
        res.status(httpStatus.OK).json({ success: true, properties });
      })
      .catch((error) => next(error));
  },

  getDistinctPropertyOptions(req, res, next) {
    getAvailablePropertyOptions()
      .then((availableFields) => {
        const options = {
          houseTypes: availableFields[0].houseTypes,
          states: availableFields[0].states,
        };
        res.status(httpStatus.OK).json({ success: true, availableFields: options });
      })
      .catch((error) => next(error));
  },

  getAssignedPropertyById(req, res, next) {
    const offerId = req.params.id;
    getAssignedPropertyById(offerId)
      .then((property) => {
        res.status(httpStatus.OK).json({
          success: true,
          property,
        });
      })
      .catch((error) => next(error));
  },
};

export default PropertyController;
