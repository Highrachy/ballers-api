import ContentProperty from '../models/contentProperty.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
import { getAreaById } from './area.service';

const addContentProperty = async (property) => {
  const area = await getAreaById(property.areaId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });
  if (area) {
    try {
      const newProperty = await new ContentProperty(property).save();
      return newProperty;
    } catch (error) {
      throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error adding content property', error);
    }
  } else {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Area not found');
  }
};

export default addContentProperty;
