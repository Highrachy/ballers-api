import Joi from '@hapi/joi';

const requiredString = (label) => Joi.string().label(label).required();

// eslint-disable-next-line import/prefer-default-export
export const paymentSchema = Joi.object({
  amount: requiredString('Amount'),
});
