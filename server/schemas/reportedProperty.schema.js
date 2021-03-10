import Joi from '@hapi/joi';
import { requiredObjectId, requiredString, optionalString } from './helper.schema';

export const reportPropertySchema = Joi.object({
  propertyId: requiredObjectId('Property Id'),
  reason: requiredString('Reason'),
});

export const resolveReportedPropertySchema = Joi.object({
  id: requiredObjectId('Report Id'),
  notes: optionalString('Reason'),
});
