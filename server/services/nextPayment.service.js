import mongoose from 'mongoose';
import { add, format, subDays } from 'date-fns';
import NextPayment from '../models/nextPayment.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
// eslint-disable-next-line import/no-cycle
import { getOfferById, generatePaymentSchedules, resolveOffer } from './offer.service';
// eslint-disable-next-line import/no-cycle
import { getTotalTransactionByOfferId } from './transaction.service';
import { NON_PROJECTED_USER_INFO } from '../helpers/projectedSchemaInfo';
import { USER_ROLE } from '../helpers/constants';
import { generatePagination, generateFacetData, getPaginationTotal } from '../helpers/pagination';
import { createNotification } from './notification.service';
import NOTIFICATIONS from '../helpers/notifications';

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

const calculateExpectedTotal = ({ amountPaid, paymentSchedules, frequency }) => {
  const todaysDate = new Date();

  return paymentSchedules.reduce(
    (result, schedule) => {
      const scheduleHasExpired = subDays(schedule.date, frequency) <= todaysDate;
      const userHasPaidForPastSchedule = amountPaid >= result.expectedTotal;

      if (scheduleHasExpired || userHasPaidForPastSchedule) {
        return {
          validSchedules:
            userHasPaidForPastSchedule || result.validSchedules.length === 0
              ? [schedule, ...result.validSchedules]
              : [...result.validSchedules],
          expectedTotal: result.expectedTotal + schedule.amount,
        };
      }

      return result;
    },
    { expectedTotal: 0, validSchedules: [] },
  );
};

export const generateNextPaymentDate = async ({ transactionId = null, offerId }) => {
  const offer = await getOfferById(offerId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (!offer) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Invalid offer');
  }

  const totalPaid = await getTotalTransactionByOfferId(offerId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  const paymentSchedules = generatePaymentSchedules(offer);

  const { validSchedules, expectedTotal } = calculateExpectedTotal({
    amountPaid: totalPaid,
    paymentSchedules,
    frequency: offer.paymentFrequency,
  });

  const pendingPayment = await getLastPendingNextPayment(offerId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  const expectedAmount = expectedTotal - totalPaid;
  const expiresOn = validSchedules[0].date;

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
    return nextPayment;
  }
  await resolveOffer(offerId);
  return {};
};

export const getUnresolvedNextPayments = async (user, { page = 1, limit = 10 } = {}) => {
  let accountType;

  if (user.role === USER_ROLE.USER) {
    accountType = {
      matchKey: 'userId',
      localField: 'vendorId',
      as: 'vendorInfo',
      unwind: '$vendorInfo',
    };
  } else {
    accountType = {
      matchKey: 'vendorId',
      localField: 'userId',
      as: 'userInfo',
      unwind: '$userInfo',
    };
  }

  const nextPaymentOptions = [
    { $match: { resolved: false } },
    {
      $lookup: {
        from: 'users',
        localField: accountType.localField,
        foreignField: '_id',
        as: accountType.as,
      },
    },
    {
      $lookup: {
        from: 'properties',
        localField: 'propertyId',
        foreignField: '_id',
        as: 'propertyInfo',
      },
    },
    { $unwind: accountType.unwind },
    { $unwind: '$propertyInfo' },
    {
      $project: {
        ...NON_PROJECTED_USER_INFO('vendorInfo'),
        ...NON_PROJECTED_USER_INFO(accountType.as),
      },
    },
    {
      $facet: {
        metadata: [{ $count: 'total' }, { $addFields: { page, limit } }],
        data: generateFacetData(page, limit),
      },
    },
  ];

  if (user.role === USER_ROLE.ADMIN) {
    nextPaymentOptions.unshift(
      {
        $lookup: {
          from: 'users',
          localField: 'vendorId',
          foreignField: '_id',
          as: 'vendorInfo',
        },
      },
      { $unwind: '$vendorInfo' },
    );
  }

  if (user.role === USER_ROLE.VENDOR || user.role === USER_ROLE.USER) {
    nextPaymentOptions.unshift({ $match: { [accountType.matchKey]: ObjectId(user._id) } });
  }

  const nextPayments = await NextPayment.aggregate(nextPaymentOptions);

  const total = getPaginationTotal(nextPayments);
  const pagination = generatePagination(page, limit, total);
  const result = nextPayments[0].data;
  return { pagination, result };
};

export const sendReminder = async () => {
  const today = new Date();
  const reminders = await NextPayment.aggregate([
    { $match: { resolved: false } },
    {
      $match: {
        $or: [
          { expiresOn: { $eq: new Date(format(add(today, { days: 1 }), 'yyyy-MM-dd')) } },
          { expiresOn: { $eq: new Date(format(add(today, { days: 7 }), 'yyyy-MM-dd')) } },
          { expiresOn: { $eq: new Date(format(add(today, { days: 30 }), 'yyyy-MM-dd')) } },
        ],
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'userInfo',
      },
    },
    {
      $lookup: {
        from: 'properties',
        localField: 'propertyId',
        foreignField: '_id',
        as: 'propertyInfo',
      },
    },
    { $unwind: '$userInfo' },
    { $unwind: '$propertyInfo' },
  ]);

  await Promise.all(
    reminders.map(async (reminder) => {
      await createNotification(NOTIFICATIONS.PAYMENT_REMINDER, reminder.userId, {
        actionId: reminder._id,
      });
    }),
  );

  return reminders;
};

export const resolveExpiredNextPayments = async () => {
  const today = new Date();

  const unResolvedNextPayments = await NextPayment.aggregate([
    { $match: { resolved: false } },
    { $match: { expiresOn: { $lte: today } } },
  ]);

  await Promise.all(
    unResolvedNextPayments.map(async (nextPayment) => {
      await generateNextPaymentDate({ offerId: nextPayment.offerId });
    }),
  );

  return unResolvedNextPayments;
};
