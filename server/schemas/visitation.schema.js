import Joi from '@hapi/joi';

const propertyVisitationSchema = Joi.object({
  propertyId: Joi.string().label('Property id').required(),
  visitorName: Joi.string().label('Name').required(),
  visitorEmail: Joi.string().label('Email address').email().optional(),
  visitorPhone: Joi.string().label('Phone').min(11).max(14).required(),
});

export default propertyVisitationSchema;
