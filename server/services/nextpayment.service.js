import mongoose from 'mongoose';
import { add } from 'date-fns';
import NextPayment from '../models/nextPayment.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
// eslint-disable-next-line import/no-cycle
import { getOfferById } from './offer.service';
// eslint-disable-next-line import/no-cycle
import { getTransactionByOfferId } from './transaction.service';

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
      resolvedViaTransaction: transactionId !== null,
      transactionId,
    },
  });
};

const calculateTotalPaid = (array) => {
  return array.reduce((a, b) => {
    return a + b.amount;
  }, 0);
};

export const generateNextPaymentDate = async ({ transactionId, offerId, transactionAmount }) => {
  let nextPayment;
  const offer = await getOfferById(offerId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  const transactions = await getTransactionByOfferId(offerId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  const nextPayments = await getNextPaymentByOfferId(offerId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  const pendingPayment = nextPayments[nextPayments.length - 1];

  const totalPaid = calculateTotalPaid(transactions);

  const outstandingBalance = offer.totalAmountPayable - totalPaid;

  if (transactionAmount === pendingPayment.expectedAmount) {
    nextPayment = {
      expectedAmount: offer.periodicPayment,
      expiresOn: add(pendingPayment.expiresOn, {
        days: offer.paymentFrequency,
      }),
      offerId,
      propertyId: offer.propertyId,
      totalOutstandingBalance: outstandingBalance,
      userId: offer.userId,
      vendorId: offer.vendorId,
    };
  }

  if (transactionAmount > pendingPayment.expectedAmount) {
    const excess = transactionAmount - pendingPayment.expectedAmount;

    nextPayment = {
      expectedAmount: offer.periodicPayment - excess,
      expiresOn: add(pendingPayment.expiresOn, {
        days: offer.paymentFrequency,
      }),
      offerId,
      propertyId: offer.propertyId,
      totalOutstandingBalance: outstandingBalance,
      userId: offer.userId,
      vendorId: offer.vendorId,
    };
  }

  if (transactionAmount < pendingPayment.expectedAmount) {
    const deficit = pendingPayment.expectedAmount - transactionAmount;

    nextPayment = {
      expectedAmount: deficit,
      expiresOn: pendingPayment.expiresOn,
      offerId,
      propertyId: offer.propertyId,
      totalOutstandingBalance: outstandingBalance,
      userId: offer.userId,
      vendorId: offer.vendorId,
    };
  }

  await resolvePendingPayment(pendingPayment._id, transactionId);

  if (totalPaid < outstandingBalance) {
    await addNextPayment(nextPayment);
  }
};
