import Joi from '@hapi/joi';

export const propertySchema = Joi.object({
  refNo: Joi.string().label('Reference number').required(),
  category: Joi.string().label('Product category').required(),
  type: Joi.string().label('Product type').required(),
  price: Joi.number().label('Product price').required(),
  area: Joi.string().label('Product area').required(),
  state: Joi.string().label('Product state').required(),
});

export const propertyUpdateSchema = Joi.object({
  email: Joi.string().label('Email Address').email().required(),
});
