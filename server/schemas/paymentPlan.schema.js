import Joi from '@hapi/joi';

Joi.objectId = require('joi-objectid')(Joi);

export const addPaymentPlanSchema = Joi.object({
  name: Joi.string().label('Plan Name').required(),
  description: Joi.string().label('Plan Description').required(),
  paymentFrequency: Joi.number().label('Plan Payment Frequency').required(),
});

export const updatePaymentPlanSchema = Joi.object({
  id: Joi.objectId().label('Plan ID').required(),
  name: Joi.string().label('Plan Name').optional(),
  description: Joi.string().label('Plan Description').optional(),
});
