import {
  addProperty,
  updateProperty,
  deleteProperty,
  getPropertyByRefNo,
  getOwnedProperties,
} from '../services/property.service';

const PropertyController = {
  add(req, res, next) {
    const property = req.locals;
    const { user } = req;
    addProperty({ ...property, owner: user._id })
      .then(() => {
        res.status(201).json({ success: true, message: 'Property added' });
      })
      .catch((error) => next(error));
  },
  update(req, res, next) {
    const updatedproperty = req.locals;
    const { user } = req;
    const owner = user._id;
    if (updatedproperty.owner === owner) {
      updateProperty(updatedproperty)
        .then(() => {
          res.status(200).json({ success: true, message: 'Property updated', updatedproperty });
        })
        .catch((error) => next(error));
    } else {
      res.status(403).json({ success: true, message: 'Forbidden access' });
    }
  },
  getAll(req, res, next) {
    const { user } = req;
    const owner = user._id;
    getOwnedProperties(owner)
      .then((properties) => {
        if (properties.length > 0) {
          res.status(200).json({ success: true, properties });
        } else {
          res.status(404).json({ success: true, message: 'No properties available' });
        }
      })
      .catch((error) => next(error));
  },
  get(req, res, next) {
    const { refNo } = req.params;
    const { user } = req;
    const owner = user._id;
    getPropertyByRefNo(refNo)
      .then((property) => {
        // eslint-disable-next-line eqeqeq
        if (property.owner == owner) {
          if (property == null) {
            res.status(404).json({ success: true, message: 'Property does not exist' });
          } else {
            res.status(200).json({ success: true, property });
          }
        } else {
          res.status(403).json({ success: true, message: 'Forbidden access' });
        }
      })
      .catch((error) => next(error));
  },
  delete(req, res, next) {
    const { refNo } = req.params;
    const { user } = req;
    const owner = user._id;

    getPropertyByRefNo(refNo)
      .then((property) => {
        // eslint-disable-next-line eqeqeq
        if (property.owner == owner) {
          deleteProperty(refNo)
            .then(() => {
              res.status(200).json({ success: true, message: 'Property deleted' });
            })
            .catch((error) => next(error));
        } else {
          res.status(403).json({ success: true, message: 'Forbidden access' });
        }
      })
      .catch((error) => next(error));
  },
};

export default PropertyController;
