import mongoose from 'mongoose';
import { add } from 'date-fns';
import Offer from '../models/offer.model';
import Enquiry from '../models/enquiry.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
import {
  OFFER_STATUS,
  CONCERN_STATUS,
  USER_ROLE,
  ACTIVE_PORTFOLIO_OFFER,
} from '../helpers/constants';
// eslint-disable-next-line import/no-cycle
import { getUserById, assignPropertyToUser } from './user.service';
// eslint-disable-next-line import/no-cycle
import { getEnquiryById, approveEnquiry } from './enquiry.service';
// eslint-disable-next-line import/no-cycle
import { getOneProperty } from './property.service';
import { getTodaysDateShortCode, getTodaysDateStandard, getEndOfDay } from '../helpers/dates';
import { generatePagination, generateFacetData, getPaginationTotal } from '../helpers/pagination';
import { NON_PROJECTED_USER_INFO } from '../helpers/projectedSchemaInfo';
import { buildFilterAndSortQuery, OFFER_FILTERS } from '../helpers/filters';
// eslint-disable-next-line import/no-cycle
import { addNextPayment } from './nextPayment.service';
import { createNotification } from './notification.service';
import NOTIFICATIONS from '../helpers/notifications';
import { getFormattedName } from '../helpers/funtions';
// eslint-disable-next-line import/no-cycle
import { activatePendingUserReferral } from './referral.service';

const { ObjectId } = mongoose.Types.ObjectId;

export const getOfferById = async (id) => Offer.findById(id).select();

export const getPropertyInitials = (propertyName) =>
  propertyName
    .match(/\b(\w)/g)
    .join('')
    .toUpperCase();

export const generateReferenceCode = async (propertyId) => {
  const property = await getOneProperty(propertyId);
  const vendorCode = 'HIG';
  const initials = getPropertyInitials(property.name);
  let numberSold = await Offer.countDocuments({ propertyId })
    .then((count) => count + 1)
    .catch((error) => {
      throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
    });
  numberSold = numberSold < 10 ? `0${numberSold}` : numberSold;
  const type = `OL${getPropertyInitials(property.houseType)}`;
  const referenceCode = `${vendorCode}/${initials}/${type}/${numberSold}/${getTodaysDateShortCode()}`;
  return referenceCode;
};

export const getAllOffers = async (accountId, { page = 1, limit = 10, ...query } = {}) => {
  const { filterQuery, sortQuery } = buildFilterAndSortQuery(OFFER_FILTERS, query);

  let accountType;
  const user = await getUserById(accountId);

  if (user.role === USER_ROLE.VENDOR || user.role === USER_ROLE.ADMIN) {
    accountType = {
      matchKey: 'vendorId',
      localField: 'userId',
      as: 'userInfo',
      unwind: '$userInfo',
    };
  } else if (user.role === USER_ROLE.USER) {
    accountType = {
      matchKey: 'userId',
      localField: 'vendorId',
      as: 'vendorInfo',
      unwind: '$vendorInfo',
    };
  }

  const offerOptions = [
    { $match: { $and: filterQuery } },
    { $sort: sortQuery },
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
        from: 'enquiries',
        localField: 'enquiryId',
        foreignField: '_id',
        as: 'enquiryInfo',
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
    {
      $unwind: accountType.unwind,
    },
    {
      $unwind: '$enquiryInfo',
    },
    {
      $unwind: '$propertyInfo',
    },
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

  if (Object.keys(sortQuery).length === 0) {
    offerOptions.splice(1, 1);
  }

  if (filterQuery.length < 1) {
    offerOptions.shift();
  }

  if (user.role === USER_ROLE.ADMIN) {
    offerOptions.unshift(
      {
        $lookup: {
          from: 'users',
          localField: 'vendorId',
          foreignField: '_id',
          as: 'vendorInfo',
        },
      },
      {
        $unwind: '$vendorInfo',
      },
    );
  }

  if (user.role === USER_ROLE.VENDOR || user.role === USER_ROLE.USER) {
    offerOptions.unshift({ $match: { [accountType.matchKey]: ObjectId(user._id) } });
  }

  const offers = await Offer.aggregate(offerOptions);

  const total = getPaginationTotal(offers);
  const pagination = generatePagination(page, limit, total);
  const result = offers[0].data;
  return { pagination, result };
};

export const getActiveOffers = async (userId) =>
  Offer.aggregate([
    { $match: { userId: ObjectId(userId) } },
    { $match: { $or: ACTIVE_PORTFOLIO_OFFER } },
    { $match: { expires: { $gte: new Date(getTodaysDateStandard()) } } },
    { $sort: { expires: 1 } },
    {
      $lookup: {
        from: 'users',
        localField: 'vendorId',
        foreignField: '_id',
        as: 'vendorInfo',
      },
    },
    {
      $lookup: {
        from: 'enquiries',
        localField: 'enquiryId',
        foreignField: '_id',
        as: 'enquiryInfo',
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
    {
      $unwind: '$vendorInfo',
    },
    {
      $unwind: '$enquiryInfo',
    },
    {
      $unwind: '$propertyInfo',
    },
    {
      $project: NON_PROJECTED_USER_INFO('vendorInfo'),
    },
  ]);

export const getOffer = async (offerId, user) => {
  const offerOptions = [
    { $match: { _id: ObjectId(offerId) } },
    {
      $lookup: {
        from: 'users',
        localField: 'vendorId',
        foreignField: '_id',
        as: 'vendorInfo',
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
        from: 'enquiries',
        localField: 'enquiryId',
        foreignField: '_id',
        as: 'enquiryInfo',
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
    {
      $lookup: {
        from: 'transactions',
        localField: '_id',
        foreignField: 'offerId',
        as: 'transactionInfo',
      },
    },
    {
      $unwind: '$vendorInfo',
    },
    {
      $unwind: '$userInfo',
    },
    {
      $unwind: '$enquiryInfo',
    },
    {
      $unwind: '$propertyInfo',
    },
    {
      $project: {
        ...NON_PROJECTED_USER_INFO('vendorInfo'),
        ...NON_PROJECTED_USER_INFO('userInfo'),
      },
    },
  ];

  if (user?.role === USER_ROLE.VENDOR) {
    offerOptions.unshift({ $match: { vendorId: ObjectId(user._id) } });
  } else if (user?.role === USER_ROLE.USER) {
    offerOptions.unshift({ $match: { userId: ObjectId(user._id) } });
  }

  const offer = await Offer.aggregate(offerOptions);

  return offer;
};

export const generatePaymentSchedules = (offer) => {
  const {
    totalAmountPayable,
    initialPayment,
    periodicPayment,
    paymentFrequency,
    initialPaymentDate,
  } = offer;
  const paymentDates = [{ date: initialPaymentDate, amount: initialPayment }];

  const numberOfPaymentsToBeMade = (totalAmountPayable - initialPayment) / periodicPayment;

  const fractionPayment = (totalAmountPayable - initialPayment) % periodicPayment;

  for (let i = 1; i <= numberOfPaymentsToBeMade; i += 1) {
    const paymentDate = add(initialPaymentDate, { days: paymentFrequency * i });
    paymentDates.push({ date: paymentDate, amount: periodicPayment });
  }

  if (fractionPayment > 0) {
    const paymentDate = add(paymentDates[paymentDates.length - 1].date, {
      days: paymentFrequency,
    });
    paymentDates.push({ date: paymentDate, amount: fractionPayment });
  }
  return paymentDates;
};

export const createOffer = async (offer) => {
  const enquiry = await getEnquiryById(offer.enquiryId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (!enquiry) {
    throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, 'Invalid enquiry');
  }

  if (enquiry.approved === true) {
    throw new ErrorHandler(
      httpStatus.PRECONDITION_FAILED,
      'An offer letter exists for this enquiry. You will need to cancel / reject the offer letter to create a new offer letter',
    );
  }

  const vendor = await getUserById(offer.vendorId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  const referenceCode = await generateReferenceCode(enquiry.propertyId);

  const user = await getUserById(enquiry.userId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });
  const userInfo = {
    firstName: user.firstName,
    email: user.email,
  };

  try {
    const newOffer = await new Offer({
      ...offer,
      expires: getEndOfDay(offer.expires),
      userId: enquiry.userId,
      propertyId: enquiry.propertyId,
      referenceCode,
    }).save();
    await approveEnquiry({ enquiryId: enquiry._id, vendor });

    const property = await getOneProperty(enquiry.propertyId);
    const description = `You have received an offer for ${getFormattedName(property.name)}`;
    await createNotification(NOTIFICATIONS.OFFER_CREATED, user._id, {
      actionId: newOffer._id,
      description,
    });
    const offerInfo = await getOffer(newOffer._id, user);
    return { ...offerInfo[0], userInfo };
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error creating offer', error);
  }
};

export const acceptOffer = async (offerToAccept) => {
  const [offer] = await getOffer(offerToAccept.offerId, offerToAccept.user).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (!offer) {
    throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, 'Invalid offer');
  }

  if (offer.userId.toString() !== offerToAccept.user._id.toString()) {
    throw new ErrorHandler(
      httpStatus.PRECONDITION_FAILED,
      'You cannot accept offer of another user',
    );
  }

  if (
    offer.status === OFFER_STATUS.CANCELLED ||
    offer.status === OFFER_STATUS.NEGLECTED ||
    offer.status === OFFER_STATUS.REJECTED
  ) {
    throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, 'You cannot accept a cancelled offer');
  }
  const propertyPrice = offer.propertyInfo.price;
  const offerPrice = offer.totalAmountPayable;
  const contributionReward = propertyPrice - offerPrice < 0 ? 0 : propertyPrice - offerPrice;

  const expiryDate = new Date(offer.expires);
  if (Date.now() > expiryDate) {
    throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, 'Offer has expired');
  }

  if (
    offer.status === OFFER_STATUS.INTERESTED ||
    offer.status === OFFER_STATUS.ASSIGNED ||
    offer.status === OFFER_STATUS.ALLOCATED
  ) {
    throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, 'Offer has been accepted');
  }

  const paymentSchedule = generatePaymentSchedules(offer);

  const nextPayment = {
    expectedAmount: paymentSchedule[0].amount,
    expiresOn: paymentSchedule[0].date,
    offerId: offer._id,
    propertyId: offer.propertyId,
    userId: offer.userId,
    vendorId: offer.vendorId,
  };

  const vendor = await getUserById(offer.vendorId);

  await activatePendingUserReferral(offer);

  try {
    await assignPropertyToUser({
      propertyId: offer.propertyId,
      userId: offer.userId,
      vendor,
    });
    await addNextPayment(nextPayment);
    await Offer.findByIdAndUpdate(
      offer._id,
      {
        $set: {
          status: OFFER_STATUS.INTERESTED,
          signature: offerToAccept.signature,
          contributionReward,
          responseDate: Date.now(),
        },
      },
      { new: true },
    );

    const property = await getOneProperty(offer.propertyId);

    const descriptionVendor = `Your offer for ${getFormattedName(property.name)} has been accepted`;
    await createNotification(NOTIFICATIONS.OFFER_RESPONSE_VENDOR, offer.vendorId, {
      actionId: offer._id,
      description: descriptionVendor,
    });

    const descriptionUser = `Congratulations on signing your offer for ${getFormattedName(
      property.name,
    )}`;
    await createNotification(NOTIFICATIONS.OFFER_RESPONSE_USER, offer.userId, {
      actionId: offer._id,
      description: descriptionUser,
    });

    const acceptedoffer = await getOffer(offerToAccept.offerId, offerToAccept.user);
    return { ...acceptedoffer[0], paymentSchedule };
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error accepting offer', error);
  }
};

export const assignOffer = async (offerId, user) => {
  const offer = await getOfferById(offerId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (offer.status !== OFFER_STATUS.INTERESTED) {
    throw new ErrorHandler(
      httpStatus.PRECONDITION_FAILED,
      'Offer letter has to be accepted before it can be assigned',
    );
  }

  try {
    await Offer.findByIdAndUpdate(
      offer.id,
      {
        $set: { status: OFFER_STATUS.ASSIGNED, dateAssigned: Date.now() },
      },
      { new: true },
    );
    return await getOffer(offerId, user);
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error assigning offer', error);
  }
};

export const cancelOffer = async ({ offerId, vendorId }) => {
  const offer = await getOfferById(offerId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (offer.vendorId.toString() !== vendorId.toString()) {
    throw new ErrorHandler(httpStatus.FORBIDDEN, 'You are not permitted to perform this action');
  }

  if (
    offer.status === OFFER_STATUS.INTERESTED ||
    offer.status === OFFER_STATUS.ASSIGNED ||
    offer.status === OFFER_STATUS.ALLOCATED
  ) {
    throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, 'You cannot cancel an accepted offer');
  }

  try {
    await Enquiry.findByIdAndUpdate(offer.enquiryId, { $set: { approved: false } });
    return Offer.findByIdAndUpdate(
      offer.id,
      { $set: { status: OFFER_STATUS.CANCELLED } },
      { new: true },
    );
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error cancelling offer', error);
  }
};

export const calculateContributionReward = async (userId) =>
  Offer.aggregate([
    { $match: { userId: ObjectId(userId) } },
    { $match: { $or: ACTIVE_PORTFOLIO_OFFER } },
    {
      $group: {
        _id: null,
        contributionReward: { $sum: '$contributionReward' },
      },
    },
  ]);

export const raiseConcern = async (concern) => {
  const offer = await getOfferById(concern.offerId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (offer.userId.toString() !== concern.user._id.toString()) {
    throw new ErrorHandler(httpStatus.FORBIDDEN, 'You are not permitted to perform this action');
  }

  try {
    await Offer.findByIdAndUpdate(
      offer.id,
      {
        $push: {
          concern: {
            question: concern.question,
            status: CONCERN_STATUS.PENDING,
            dateAsked: getTodaysDateStandard(),
          },
        },
      },
      { new: true, safe: true, upsert: true },
    );

    const property = await getOneProperty(offer.propertyId);

    const description = `A comment has been raised on your offer for ${getFormattedName(
      property.name,
    )}`;
    await createNotification(NOTIFICATIONS.RAISE_CONCERN, offer.userId, {
      actionId: offer._id,
      description,
    });

    return await getOffer(concern.offerId, concern.user);
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error raising concern', error);
  }
};

export const resolveConcern = async (concern) => {
  const offer = await getOfferById(concern.offerId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (offer.vendorId.toString() !== concern.vendor._id.toString()) {
    throw new ErrorHandler(httpStatus.FORBIDDEN, 'You are not permitted to perform this action');
  }

  try {
    await Offer.findOneAndUpdate(
      { _id: offer.id, 'concern._id': concern.concernId },
      {
        $set: {
          'concern.$.response': concern.response,
          'concern.$.status': CONCERN_STATUS.RESOLVED,
          'concern.$.dateResponded': getTodaysDateStandard(),
        },
      },
      { new: true },
    );
    await createNotification(NOTIFICATIONS.RESOLVE_CONCERN, offer.userId, { actionId: offer._id });
    return await getOffer(concern.offerId, concern.vendor);
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error resolving concern', error);
  }
};

export const getAllUserOffers = async (user, accountId, page = 1, limit = 10) => {
  const offerOptions = [
    { $match: { userId: ObjectId(accountId) } },
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
        from: 'enquiries',
        localField: 'enquiryId',
        foreignField: '_id',
        as: 'enquiryInfo',
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
    {
      $lookup: {
        from: 'users',
        localField: 'vendorId',
        foreignField: '_id',
        as: 'vendorInfo',
      },
    },
    {
      $unwind: '$userInfo',
    },
    {
      $unwind: '$enquiryInfo',
    },
    {
      $unwind: '$propertyInfo',
    },
    {
      $unwind: '$vendorInfo',
    },
    {
      $project: {
        ...NON_PROJECTED_USER_INFO('vendorInfo'),
        ...NON_PROJECTED_USER_INFO('userInfo'),
      },
    },
    {
      $facet: {
        metadata: [{ $count: 'total' }, { $addFields: { page, limit } }],
        data: generateFacetData(page, limit),
      },
    },
  ];

  if (user.role === USER_ROLE.VENDOR) {
    offerOptions.unshift({ $match: { vendorId: ObjectId(user._id) } });
  }

  if (user.role === USER_ROLE.USER && user._id.toString() !== accountId.toString()) {
    throw new ErrorHandler(httpStatus.FORBIDDEN, 'You are not permitted to perform this action');
  }

  const offers = await Offer.aggregate(offerOptions);

  const total = getPaginationTotal(offers);
  const pagination = generatePagination(page, limit, total);
  const result = offers[0].data;
  return { pagination, result };
};

export const resolveOffer = async (offerId) => {
  try {
    return Offer.findByIdAndUpdate(
      offerId,
      { $set: { status: OFFER_STATUS.RESOLVED } },
      { new: true },
    );
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error resolving offer', error);
  }
};

export const reactivateOffer = async (offerInfo) => {
  const offer = await getOfferById(offerInfo.offerId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (!offer) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Invalid offer');
  }

  if (offer.vendorId.toString() !== offerInfo.vendorId.toString()) {
    throw new ErrorHandler(httpStatus.FORBIDDEN, 'You are not permitted to perform this action');
  }

  if (Date.now() < offer.expires) {
    throw new ErrorHandler(
      httpStatus.PRECONDITION_FAILED,
      'Only expired offers can be reactivated',
    );
  }

  if (offer.status !== OFFER_STATUS.GENERATED) {
    throw new ErrorHandler(
      httpStatus.PRECONDITION_FAILED,
      'Only unprocessed offers can be reactivated',
    );
  }

  const user = await getUserById(offer.userId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  const updatedOffer = {
    ...offer.toObject(),
    initialPaymentDate: offerInfo.initialPaymentDate,
    expires: getEndOfDay(offerInfo.expires),
  };

  delete updatedOffer._id;
  delete updatedOffer.createdAt;
  delete updatedOffer.updatedAt;

  try {
    await Offer.findByIdAndUpdate(offer._id, { status: OFFER_STATUS.REACTIVATED });
    const newOffer = await new Offer(updatedOffer).save();

    const property = await getOneProperty(offer.propertyId);
    const description = `Your offer for ${getFormattedName(property.name)} has been reactivated`;
    await createNotification(NOTIFICATIONS.OFFER_REACTIVATED, offer.userId, {
      actionId: offer._id,
      description,
    });

    const reactivatedOffer = await getOffer(newOffer._id, user);
    return reactivatedOffer[0];
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error reactivating offer', error);
  }
};

export const isVendorFirstSale = async (vendorId) => {
  const offer = await Offer.find({ vendorId: ObjectId(vendorId), status: OFFER_STATUS.RESOLVED });

  return offer.length === 1;
};
