import Joi from '@hapi/joi';
import {
  requiredFutureDate,
  requiredObjectId,
  requiredPhoneNumber,
  requiredString,
  optionalEmail,
} from './helper.schema';

const propertyVisitationSchema = Joi.object({
  propertyId: requiredObjectId('Property id'),
  visitorName: requiredString('Name'),
  visitorEmail: optionalEmail('Email address'),
  visitorPhone: requiredPhoneNumber('Phone'),
  visitDate: requiredFutureDate('Visit Date'),
});

export default propertyVisitationSchema;
