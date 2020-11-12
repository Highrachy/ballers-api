import addContentProperty from '../services/contentProperty.service';
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
};

export default ContentPropertyController;
