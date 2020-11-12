import Joi from '@hapi/joi';

Joi.objectId = require('joi-objectid')(Joi);

const addContentPropertySchema = Joi.object({
  areaId: Joi.objectId().label('Area Id').required(),
  category: Joi.string().label('Category').required(),
  houseType: Joi.string().label('Property Type').required(),
  price: Joi.number().label('Price').required(),
  website: Joi.string().label('Website').optional(),
  link: Joi.string().label('URL').optional(),
});

export default addContentPropertySchema;
