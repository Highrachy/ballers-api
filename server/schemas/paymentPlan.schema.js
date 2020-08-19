import Joi from '@hapi/joi';

Joi.objectId = require('joi-objectid')(Joi);

const addPlanSchema = Joi.object({
  planName: Joi.string().label('Plan Name').required(),
  planDescription: Joi.string().label('Plan Description').required(),
  paymentFrequency: Joi.string().label('Plan Payment Frequency').required(),
});

export default addPlanSchema;
