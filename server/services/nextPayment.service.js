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

  if (validSchedules.length === 0) {
    validSchedules.push(schedule[0]);
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
  return NextPayment.aggregate([
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
};

export const recalculateNextPayment = async (offerId, user) => {
  const offer = await getOfferById(offerId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (!offer) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Invalid offer');
  }

  if (
    (user.role === USER_ROLE.VENDOR && offer.vendorId.toString() !== user._id.toString()) ||
    (user.role === USER_ROLE.USER && offer.userId.toString() !== user._id.toString())
  ) {
    throw new ErrorHandler(httpStatus.FORBIDDEN, 'You are not permitted to perform this action');
  }

  const nextPayment = await generateNextPaymentDate({ offerId }).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (Object.keys(nextPayment).length === 0) {
    throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, 'Offer has been completed');
  }

  return nextPayment;
};
