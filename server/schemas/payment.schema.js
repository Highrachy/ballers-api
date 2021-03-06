import Joi from '@hapi/joi';
import { requiredObjectId, requiredString } from './helper.schema';

const paymentSchema = Joi.object({
  amount: requiredString('Amount'),
  offerId: requiredObjectId('Offer Id'),
});

export default paymentSchema;
