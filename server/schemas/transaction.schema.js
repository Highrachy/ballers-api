import Joi from '@hapi/joi';
import { requiredObjectId, requiredDate } from './helper.schema';

const updateTransactionSchema = Joi.object({
  transactionId: requiredObjectId('Transaction Id'),
  paidOn: requiredDate('Payment Date'),
});

export default updateTransactionSchema;
