import {
  addProperty,
  updateProperty,
  deleteProperty,
  getAllPropertiesAddedByVendor,
  getAllProperties,
  searchThroughProperties,
  getOneProperty,
  getAvailablePropertyOptions,
  getAssignedPropertyByOfferId,
  getAssignedProperties,
  addNeighborhood,
  updateNeighborhood,
  deleteNeighborhood,
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
    const updatedProperty = req.locals;
    const { user } = req;
    updateProperty({ ...updatedProperty, vendor: user })
      .then((property) => {
        res.status(httpStatus.OK).json({ success: true, message: 'Property updated', property });
      })
      .catch((error) => next(error));
  },

  delete(req, res, next) {
    const propertyId = req.params.id;
    const { user } = req;
    deleteProperty({ propertyId, user })
      .then(() => {
        res.status(httpStatus.OK).json({ success: true, message: 'Property deleted' });
      })
      .catch((error) => next(error));
  },

  getAllPropertiesAddedByVendor(req, res, next) {
    const adminId = req.params.id;
    getAllPropertiesAddedByVendor(adminId)
      .then((properties) => {
        res.status(httpStatus.OK).json({ success: true, properties });
      })
      .catch((error) => next(error));
  },

  getAllProperties(req, res, next) {
    const { user, query } = req;
    getAllProperties(user, query)
      .then(({ result, pagination }) => {
        res.status(httpStatus.OK).json({ success: true, pagination, result });
      })
      .catch((error) => next(error));
  },

  getOneProperty(req, res, next) {
    const propertId = req.params.id;
    const { user } = req;
    getOneProperty(propertId, user)
      .then((property) => {
        if (property.length > 0) {
          res.status(httpStatus.OK).json({ success: true, property: property[0] });
        } else {
          res.status(httpStatus.NOT_FOUND).json({ success: false, message: 'Property not found' });
        }
      })
      .catch((error) => next(error));
  },
  search(req, res, next) {
    const filter = req.locals;
    const userId = req.user._id;

    searchThroughProperties({ ...filter, userId })
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

  getAssignedPropertyByOfferId(req, res, next) {
    const offerId = req.params.id;
    const { user } = req;
    getAssignedPropertyByOfferId(offerId, user)
      .then((property) => {
        res.status(httpStatus.OK).json({
          success: true,
          property,
        });
      })
      .catch((error) => next(error));
  },

  getAssignedProperties(req, res, next) {
    const userId = req.user._id;
    getAssignedProperties(userId)
      .then((properties) => {
        res.status(httpStatus.OK).json({
          success: true,
          properties,
        });
      })
      .catch((error) => next(error));
  },

  addNeighborhood(req, res, next) {
    const neighborhood = req.locals;
    const propertyId = req.params.id;
    const vendorId = req.user._id;
    addNeighborhood({ ...neighborhood, propertyId, vendorId })
      .then((property) => {
        res.status(httpStatus.OK).json({ success: true, message: 'Neighborhood added', property });
      })
      .catch((error) => next(error));
  },

  updateNeighborhood(req, res, next) {
    const updatedNeighborhood = req.locals;
    const propertyId = req.params.id;
    const vendorId = req.user._id;
    updateNeighborhood({ ...updatedNeighborhood, propertyId, vendorId })
      .then((property) => {
        res
          .status(httpStatus.OK)
          .json({ success: true, message: 'Neighborhood updated', property });
      })
      .catch((error) => next(error));
  },

  deleteNeighborhood(req, res, next) {
    const neighborhood = req.locals;
    const propertyId = req.params.id;
    const vendorId = req.user._id;
    deleteNeighborhood({ ...neighborhood, propertyId, vendorId })
      .then((property) => {
        res
          .status(httpStatus.OK)
          .json({ success: true, message: 'Neighborhood deleted', property });
      })
      .catch((error) => next(error));
  },
};

export default PropertyController;
