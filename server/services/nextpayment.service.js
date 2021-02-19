import NextPayment from '../models/nextPayment.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
// import {PAYMENT_STATUS} from '../helpers/constants'

export const getNextPaymentById = async (id) => NextPayment.findById(id).select();

export const addNextPayment = async (payment) => {
  try {
    return await new NextPayment(payment).save();
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error adding next payment', error);
  }
};

// export const closePayment = async (paymentId)=>{
//     const payment = await getNextPaymentById(paymentId)

// }
