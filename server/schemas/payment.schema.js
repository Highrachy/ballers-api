import Joi from '@hapi/joi';

const email = Joi.string().label('Email Address').email().required();
const requiredString = (label) => Joi.string().label(label).required();

// eslint-disable-next-line import/prefer-default-export
export const paymentSchema = Joi.object({
  amount: requiredString('Amount'),
  email,
});
