import {
  addContentProperty,
  updateContentProperty,
  deleteContentProperty,
} from '../services/contentProperty.service';
import httpStatus from '../helpers/httpStatus';

const ContentPropertyController = {
  add(req, res, next) {
    const contentProperty = req.locals;
    addContentProperty(contentProperty)
      .then((property) => {
        res
          .status(httpStatus.CREATED)
          .json({ success: true, message: 'Property added successfully', property });
      })
      .catch((error) => next(error));
  },

  update(req, res, next) {
    const updatedPaymentPlan = req.locals;
    updateContentProperty(updatedPaymentPlan)
      .then((plan) => {
        res.status(httpStatus.OK).json({ success: true, message: 'Property updated', plan });
      })
      .catch((error) => next(error));
  },

  delete(req, res, next) {
    const { id } = req.params;
    deleteContentProperty(id)
      .then(() => {
        res.status(httpStatus.OK).json({ success: true, message: 'Property deleted' });
      })
      .catch((error) => next(error));
  },
};

export default ContentPropertyController;
