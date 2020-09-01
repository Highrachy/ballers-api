import Joi from '@hapi/joi';

Joi.objectId = require('joi-objectid')(Joi);

const propertyVisitationSchema = Joi.object({
  propertyId: Joi.objectId().label('Property id').required(),
  visitorName: Joi.string().label('Name').required(),
  visitorEmail: Joi.string().label('Email address').email().optional(),
  visitorPhone: Joi.string().label('Phone').min(11).max(14).required(),
  visitDate: Joi.string().label('Visit Date').required(),
});

export default propertyVisitationSchema;
