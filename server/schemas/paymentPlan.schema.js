import Joi from '@hapi/joi';
import { requiredObjectId, requiredString, requiredNumber, optionalString } from './helper.schema';

export const addPaymentPlanSchema = Joi.object({
  name: requiredString('Plan Name'),
  description: requiredString('Plan Description'),
  paymentFrequency: requiredNumber('Plan Payment Frequency'),
});

export const updatePaymentPlanSchema = Joi.object({
  id: requiredObjectId('Plan ID'),
  name: optionalString('Plan Name'),
  description: optionalString('Plan Description'),
});
