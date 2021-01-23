import Joi from '@hapi/joi';
import {
  requiredFutureDate,
  requiredObjectId,
  requiredPhoneNumber,
  requiredString,
  nonRequiredEmail,
} from './helper.schema';

const propertyVisitationSchema = Joi.object({
  propertyId: requiredObjectId('Property id'),
  visitorName: requiredString('Name'),
  visitorEmail: nonRequiredEmail('Email address'),
  visitorPhone: requiredPhoneNumber('Phone'),
  visitDate: requiredFutureDate('Visit Date'),
});

export default propertyVisitationSchema;
