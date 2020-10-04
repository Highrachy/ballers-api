import axios from 'axios';
import { HOST } from '../config';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';

export const PAYSTACK_URL = {
  INITIALIZE: 'https://api.paystack.co/transaction/initialize',
  VERIFY_TRANSACTION: 'https://api.paystack.co/transaction/verify',
  ALL_TRANSACTIONS: 'https://api.paystack.co/transaction',
  ALL_CUSTOMERS: 'https://api.paystack.co/customer',
};

export const initiatePaystackPayment = async ({ amount, user, propertyId }) => {
  try {
    const response = await axios.post(
      PAYSTACK_URL.INITIALIZE,
      {
        amount: amount * 100,
        callback_url: `${HOST}/payment`,
        email: user.email,
        metadata: {
          custom_fields: [
            {
              display_name: 'Property Id',
              variable_name: 'propertyId',
              value: propertyId,
            },
            {
              display_name: 'User Id',
              variable_name: 'userId',
              value: user._id,
            },
          ],
        },
      },
      {
        headers: {
          authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'content-type': 'application/json',
        },
      },
    );
    return response.data.data;
  } catch (error) {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Payment cannot be initiated', error);
  }
};

export const verifyPaystackPayment = async (reference) => {
  try {
    const response = await axios.get(`${PAYSTACK_URL.VERIFY_TRANSACTION}/${reference}`, {
      headers: {
        authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'content-type': 'application/json',
      },
    });
    return response.data.data;
  } catch (error) {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Error verifying reference', error);
  }
};
