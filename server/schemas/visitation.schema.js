import Joi from '@hapi/joi';

Joi.objectId = require('joi-objectid')(Joi);

const today = new Date().toISOString().slice(0, 10);

const propertyVisitationSchema = Joi.object({
  propertyId: Joi.objectId().label('Property id').required(),
  visitorName: Joi.string().label('Name').required(),
  visitorEmail: Joi.string().label('Email address').email().optional(),
  visitorPhone: Joi.string().label('Phone').min(11).max(14).required(),
  visitDate: Joi.date()
    .greater(today)
    .label('Visit Date')
    .required()
    .messages({
      'date.greater': `"Visit Date" should a date later than ${new Date(
        Date.parse(today),
      ).toUTCString()}`,
    }),
});

export default propertyVisitationSchema;
