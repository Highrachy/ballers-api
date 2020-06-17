import axios from 'axios';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';

export const PAYSTACK_URL = {
  INITIALIZE: 'https://api.paystack.co/transaction/initialize',
  VERIFY_TRANSACTION: 'https://api.paystack.co/transaction/verify',
  ALL_TRANSACTIONS: 'https://api.paystack.co/transaction',
  ALL_CUSTOMERS: 'https://api.paystack.co/customer',
};

export const initiatePaystackPayment = async (amount, email) => {
  try {
    const response = await axios.post(
      PAYSTACK_URL.INITIALIZE,
      {
        amount: amount * 100,
        email,
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
