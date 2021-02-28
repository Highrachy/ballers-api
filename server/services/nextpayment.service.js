import mongoose from 'mongoose';
import { add } from 'date-fns';
import NextPayment from '../models/nextPayment.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
// eslint-disable-next-line import/no-cycle
import { getOfferById } from './offer.service';

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

export const resolvePendingPayment = async (pendingPaymentId, transactionId) => {
  return NextPayment.findByIdAndUpdate(pendingPaymentId, {
    $set: {
      resolved: true,
      resolvedDate: Date.now(),
      resolvedViaTransaction: true,
      transactionId,
    },
  });
};

export const generateNextPaymentDate = async ({ transactionId, offerId, transactionAmount }) => {
  const offer = await getOfferById(offerId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  // const transactions = await getTransactionByOfferId(offerId).catch((error) => {
  //   throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  // });

  const previousPayments = await getNextPaymentByOfferId(offerId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });
  const pendingPayment = previousPayments[previousPayments.length - 1];

  if (transactionAmount === pendingPayment.expectedAmount) {
    await resolvePendingPayment(pendingPayment._id, transactionId);

    const nextPayment = {
      expectedAmount: offer.periodicPayment,
      expiresOn: add(pendingPayment.expiresOn, {
        days: offer.paymentFrequency,
      }),
      offerId,
      propertyId: offer.propertyId,
      userId: offer.userId,
      vendorId: offer.vendorId,
    };

    await addNextPayment(nextPayment);
  }

  if (transactionAmount > pendingPayment.expectedAmount) {
    await resolvePendingPayment(pendingPayment._id, transactionId);

    const excess = transactionAmount - pendingPayment.expectedAmount;

    const nextPayment = {
      expectedAmount: offer.periodicPayment - excess,
      expiresOn: add(pendingPayment.expiresOn, {
        days: offer.paymentFrequency,
      }),
      offerId,
      propertyId: offer.propertyId,
      userId: offer.userId,
      vendorId: offer.vendorId,
    };

    await addNextPayment(nextPayment);
  }

  if (transactionAmount < pendingPayment.expectedAmount) {
    await resolvePendingPayment(pendingPayment._id, transactionId);

    const deficit = pendingPayment.expectedAmount - transactionAmount;

    const nextPayment = {
      expectedAmount: offer.periodicPayment + deficit,
      expiresOn: add(pendingPayment.expiresOn, {
        days: offer.paymentFrequency,
      }),
      offerId,
      propertyId: offer.propertyId,
      userId: offer.userId,
      vendorId: offer.vendorId,
    };

    await addNextPayment(nextPayment);
  }
};
