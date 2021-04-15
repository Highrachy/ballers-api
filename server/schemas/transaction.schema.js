import Joi from '@hapi/joi';
import { requiredObjectId, requiredNumber, requiredDate, optionalNumber } from './helper.schema';

const addRemittanceSchema = Joi.object({
  transactionId: requiredObjectId('Transaction Id'),
  amount: requiredNumber('Amount'),
  date: requiredDate('Date'),
  percentage: optionalNumber('Percentage'),
});

export default addRemittanceSchema;
