import {
  addProperty,
  updateProperty,
  deleteProperty,
  getAllPropertiesAddedByVendor,
  getAllProperties,
  searchThroughProperties,
  getOneProperty,
  getAvailablePropertyOptions,
  getAllPortfolios,
  addNeighborhood,
  updateNeighborhood,
  deleteNeighborhood,
  addFloorPlan,
  updateFloorPlan,
  deleteFloorPlan,
  addGallery,
  updateGallery,
  deleteGallery,
  flagProperty,
  unflagProperty,
  getOnePortfolio,
} from '../services/property.service';
import httpStatus from '../helpers/httpStatus';
import EMAIL_CONTENT from '../../mailer';
import { sendMail } from '../services/mailer.service';
import { getFormattedName } from '../helpers/funtions';

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
    const { user, query } = req;
    searchThroughProperties(user, query)
      .then(({ result, pagination }) => {
        res.status(httpStatus.OK).json({ success: true, pagination, result });
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

  getAllPortfolios(req, res, next) {
    const { user, query } = req;
    getAllPortfolios(user, query)
      .then(({ result, pagination }) => {
        res.status(httpStatus.OK).json({ success: true, pagination, result });
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

  addFloorPlan(req, res, next) {
    const floorPlan = req.locals;
    const propertyId = req.params.id;
    const vendorId = req.user._id;
    addFloorPlan({ ...floorPlan, propertyId, vendorId })
      .then((property) => {
        res.status(httpStatus.OK).json({ success: true, message: 'Floor Plan added', property });
      })
      .catch((error) => next(error));
  },

  updateFloorPlan(req, res, next) {
    const updatedFloorPlan = req.locals;
    const propertyId = req.params.id;
    const vendorId = req.user._id;
    updateFloorPlan({ ...updatedFloorPlan, propertyId, vendorId })
      .then((property) => {
        res.status(httpStatus.OK).json({ success: true, message: 'Floor Plan updated', property });
      })
      .catch((error) => next(error));
  },

  deleteFloorPlan(req, res, next) {
    const floorPlan = req.locals;
    const propertyId = req.params.id;
    const vendorId = req.user._id;
    deleteFloorPlan({ ...floorPlan, propertyId, vendorId })
      .then((property) => {
        res.status(httpStatus.OK).json({ success: true, message: 'Floor Plan deleted', property });
      })
      .catch((error) => next(error));
  },

  addGallery(req, res, next) {
    const image = req.locals;
    const propertyId = req.params.id;
    const vendorId = req.user._id;
    addGallery({ ...image, propertyId, vendorId })
      .then((property) => {
        res.status(httpStatus.OK).json({ success: true, message: 'Image added', property });
      })
      .catch((error) => next(error));
  },

  updateGallery(req, res, next) {
    const updatedImage = req.locals;
    const propertyId = req.params.id;
    const vendorId = req.user._id;
    updateGallery({ ...updatedImage, propertyId, vendorId })
      .then((property) => {
        res.status(httpStatus.OK).json({ success: true, message: 'Image updated', property });
      })
      .catch((error) => next(error));
  },

  deleteGallery(req, res, next) {
    const image = req.locals;
    const propertyId = req.params.id;
    const vendorId = req.user._id;
    deleteGallery({ ...image, propertyId, vendorId })
      .then((property) => {
        res.status(httpStatus.OK).json({ success: true, message: 'Image deleted', property });
      })
      .catch((error) => next(error));
  },

  flagProperty(req, res, next) {
    const propertyInfo = req.locals;
    const adminId = req.user._id;
    flagProperty({ ...propertyInfo, adminId })
      .then(({ property, vendor }) => {
        const contentTop = `Your property ${getFormattedName(
          property.name,
        )} has been flagged, and is now unavailable for viewing. Kindly visit your dashboard to resolve the issue.`;
        sendMail(EMAIL_CONTENT.FLAG_PROPERTY, vendor, { contentTop });

        res.status(httpStatus.OK).json({ success: true, message: 'Property flagged', property });
      })
      .catch((error) => next(error));
  },

  unflagProperty(req, res, next) {
    const propertyInfo = req.locals;
    const adminId = req.user._id;
    unflagProperty({ ...propertyInfo, adminId })
      .then(({ property, vendor }) => {
        const contentTop = `Your property ${getFormattedName(
          property.name,
        )} has been unflagged, and is now available for viewing.`;
        sendMail(EMAIL_CONTENT.UNFLAG_PROPERTY, vendor, { contentTop });

        res.status(httpStatus.OK).json({ success: true, message: 'Property unflagged', property });
      })
      .catch((error) => next(error));
  },

  getOnePortfolio(req, res, next) {
    const offerId = req.params.id;
    const { user } = req;
    getOnePortfolio(offerId, user)
      .then((portfolio) => {
        res.status(httpStatus.OK).json({ success: true, portfolio });
      })
      .catch((error) => next(error));
  },
};

export default PropertyController;
