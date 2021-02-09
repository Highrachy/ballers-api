import Joi from '@hapi/joi';
import {
  requiredFutureDate,
  requiredObjectId,
  requiredPhoneNumber,
  requiredString,
  nonRequiredEmail,
} from './helper.schema';

export const propertyVisitationSchema = Joi.object({
  propertyId: requiredObjectId('Property id'),
  visitorName: requiredString('Name'),
  visitorEmail: nonRequiredEmail('Email address'),
  visitorPhone: requiredPhoneNumber('Phone'),
  visitDate: requiredFutureDate('Visit Date'),
});

export const resolveVisitationSchema = Joi.object({
  visitationId: requiredObjectId('Visitation id'),
});

export const rescheduleVisitationSchema = Joi.object({
  visitationId: requiredObjectId('Visitation id'),
  visitDate: requiredFutureDate('New Visit Date'),
  reason: requiredString('Reason'),
});
