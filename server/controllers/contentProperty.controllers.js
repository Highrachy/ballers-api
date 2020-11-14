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
};

export default ContentPropertyController;
