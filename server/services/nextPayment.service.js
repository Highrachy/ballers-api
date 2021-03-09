import mongoose from 'mongoose';
import { add, format, subDays } from 'date-fns';
import NextPayment from '../models/nextPayment.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
// eslint-disable-next-line import/no-cycle
import { getOfferById, generatePaymentSchedules } from './offer.service';
// eslint-disable-next-line import/no-cycle
import { getTotalTransactionByOfferId } from './transaction.service';

const { ObjectId } = mongoose.Types.ObjectId;

export const getLastPendingNextPayment = async (offerId) =>
  NextPayment.find({ offerId: ObjectId(offerId) })
    .sort({ _id: -1 })
    .limit(1);

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

const calculateExpectedTotal = (schedule, frequency) => {
  const today = new Date();
  const validSchedules = schedule.reduce((acc, val) => {
    if (subDays(val.date, frequency) <= today) {
      acc.push(val);
    }
    return acc;
  }, []);

  if (
    validSchedules.length === schedule.length - 1 &&
    new Date(format(add(today, { days: frequency }), 'yyyy-MM-dd')) >
      schedule[schedule.length - 1].date
  ) {
    validSchedules.push(schedule[schedule.length - 1]);
  }

  const expectedTotal = validSchedules.reduce((a, b) => {
    return a + b.amount;
  }, 0);

  return { validSchedules, expectedTotal };
};

export const generateNextPaymentDate = async ({ transactionId = null, offerId }) => {
  const offer = await getOfferById(offerId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  const totalPaid = await getTotalTransactionByOfferId(offerId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  const paymentSchedule = generatePaymentSchedules(offer);

  const { validSchedules, expectedTotal } = calculateExpectedTotal(
    paymentSchedule,
    offer.paymentFrequency,
  );

  const pendingPayment = await getLastPendingNextPayment(offerId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  let expectedAmount = expectedTotal - totalPaid;
  let expiresOn = paymentSchedule[validSchedules.length - 1].date;

  if (expectedTotal === totalPaid && paymentSchedule.length !== validSchedules.length) {
    expectedAmount = offer.periodicPayment;
    expiresOn = paymentSchedule[validSchedules.length].date;
  }

  if (
    expectedTotal - totalPaid < 0 &&
    paymentSchedule.length !== validSchedules.length &&
    totalPaid !== offer.totalAmountPayable
  ) {
    const advance = Math.ceil(Math.abs(expectedTotal - totalPaid) / offer.periodicPayment);
    expectedAmount = offer.periodicPayment * advance - Math.abs(expectedTotal - totalPaid);
    expiresOn = paymentSchedule[validSchedules.length - 1 + advance].date;
  }

  const nextPayment = {
    expectedAmount: expectedAmount === 0 ? offer.periodicPayment : expectedAmount,
    expiresOn,
    offerId,
    propertyId: offer.propertyId,
    userId: offer.userId,
    vendorId: offer.vendorId,
  };

  if (pendingPayment.length > 0) {
    await resolvePendingPayment(pendingPayment[0]._id, transactionId);
  }

  if (totalPaid < offer.totalAmountPayable) {
    await addNextPayment(nextPayment);
  }
};
