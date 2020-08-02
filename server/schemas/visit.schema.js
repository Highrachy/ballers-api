import Joi from '@hapi/joi';

const propertyVisitationSchema = Joi.object({
  propertyId: Joi.string().label('Property id').required(),
  visitorName: Joi.string().label('Visitor name').required(),
  visitorPhone: Joi.string().label('Visitor phone').required(),
});

export default propertyVisitationSchema;
