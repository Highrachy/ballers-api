import Joi from '@hapi/joi';
import {
  requiredObjectId,
  requiredString,
  optionalString,
  requiredNumber,
  optionalNumber,
} from './helper.schema';

export const addAccountSchema = Joi.object({
  accountName: requiredString('Account Name'),
  accountNumber: requiredNumber('Account Number'),
  bank: requiredString('Bank'),
});

export const updateAccountSchema = Joi.object({
  id: requiredObjectId('Account Id'),
  accountName: optionalString('Account Name'),
  accountNumber: optionalNumber('Account Number'),
  bank: optionalString('Bank'),
});
