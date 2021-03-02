import mongoose from 'mongoose';
import NextPayment from '../models/nextPayment.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
// eslint-disable-next-line import/no-cycle
import { getOfferById, generatePaymentSchedules } from './offer.service';
// eslint-disable-next-line import/no-cycle
import { getTotalPaidOnOffer } from './transaction.service';

const { ObjectId } = mongoose.Types.ObjectId;

export const getNextPaymentById = async (id) => NextPayment.findById(id).select();

export const getNextPaymentByOfferId = async (offerId) =>
  NextPayment.find({ offerId: ObjectId(offerId) }).select();

export const addNextPayment = async (payment) => {
  try {
    return await new NextPayment(payment).save();
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error adding next payment', error);
  }
};

export const resolvePendingPayment = async (pendingPaymentId, transactionId = null) => {
  return NextPayment.findByIdAndUpdate(pendingPaymentId, {
    $set: {
      resolved: true,
      resolvedDate: Date.now(),
      resolvedViaTransaction: !!transactionId,
      transactionId,
    },
  });
};

const calculateExpectedTotal = (schedule) => {
  const today = new Date();
  const validSchedules = schedule.reduce((acc, val) => {
    if (val.date <= today) {
      acc.push(val);
    }
    return acc;
  }, []);

  const expectedTotal = validSchedules.reduce((a, b) => {
    return a + b.amount;
  }, 0);

  return { validSchedules, expectedTotal };
};

export const generateNextPaymentDate = async ({ transactionId = null, offerId }) => {
  const offer = await getOfferById(offerId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  const totalPaid = await getTotalPaidOnOffer(offerId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  const paymentSchedule = generatePaymentSchedules(offer);

  const { validSchedules, expectedTotal } = calculateExpectedTotal(paymentSchedule);

  const nextPayments = await getNextPaymentByOfferId(offerId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  const pendingPayment = nextPayments[nextPayments.length - 1];

  const nextPayment = {
    expectedAmount: expectedTotal - totalPaid,
    expiresOn: paymentSchedule[validSchedules.length].date,
    offerId,
    propertyId: offer.propertyId,
    userId: offer.userId,
    vendorId: offer.vendorId,
  };

  await resolvePendingPayment(pendingPayment._id, transactionId);

  await addNextPayment(nextPayment);
};
