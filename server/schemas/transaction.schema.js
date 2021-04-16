import Joi from '@hapi/joi';
import { requiredObjectId, requiredDate, optionalNumber } from './helper.schema';

const addRemittanceSchema = Joi.object({
  transactionId: requiredObjectId('Transaction Id'),
  date: requiredDate('Date'),
  percentage: optionalNumber('Percentage'),
});

export default addRemittanceSchema;
