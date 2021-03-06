/* eslint-disable import/no-cycle */
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/user.model';
import { USER_SECRET } from '../config';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
import { getPropertyById, updateProperty } from './property.service';
import { calculateContributionReward } from './offer.service';
import { addReferral, calculateReferralRewards } from './referral.service';
import { getTotalAmountPaidByUser } from './transaction.service';
import {
  REFERRAL_STATUS,
  USER_ROLE,
  VENDOR_INFO_STATUS,
  VENDOR_STEPS,
  COMMENT_STATUS,
} from '../helpers/constants';
import { generatePagination, generateFacetData, getPaginationTotal } from '../helpers/pagination';
import { getDateWithTimestamp } from '../helpers/dates';
import { buildFilterAndSortQuery, USER_FILTERS } from '../helpers/filters';
import { createNotification } from './notification.service';
import NOTIFICATIONS from '../helpers/notifications';
import { assignBadgeAutomatically } from './assignedBadge.service';
import AUTOMATED_BADGES from '../helpers/automatedBadges';

const { ObjectId } = mongoose.Types.ObjectId;

export const getUserByEmail = async (email, fields = null) =>
  User.findOne({ email }).select(fields).collation({ locale: 'en', strength: 2 });

export const getUserById = async (id) => User.findById(id).select();

export const generateToken = (id, expiresIn = '30d') =>
  jwt.sign({ id }, USER_SECRET, { expiresIn });

export const decodeToken = (token) => jwt.verify(token, USER_SECRET);

export const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw new Error(error);
  }
};

export const comparePassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    throw new Error(error);
  }
};

export const getUserByReferralCode = async (referralCode, fields = null) =>
  User.findOne({ referralCode }).select(fields);

export const generateCode = (name) => {
  const firstName = name.replace(/\s/g, '');
  const possible = '0123456789';
  const charsToAdd = firstName.length < 2 ? 6 - firstName.length : 4;
  let referralCode = firstName.substring(0, 2).toLowerCase();

  for (let i = 0; i < charsToAdd; i += 1) {
    referralCode += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return referralCode;
};

export const generateReferralCode = async (firstName) => {
  let referralCode;
  let referralCodeIsUsed = true;

  while (referralCodeIsUsed) {
    referralCode = generateCode(firstName);
    // eslint-disable-next-line no-await-in-loop
    const invalidReferralCode = await getUserByReferralCode(referralCode).catch((error) => {
      throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
    });
    if (invalidReferralCode === null) {
      referralCodeIsUsed = false;
    }
  }
  return referralCode;
};

export const addUser = async (user) => {
  let referrer;
  const isVendor = user.vendor && user.vendor.companyName;

  const referralCode = await generateReferralCode(user.firstName).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  const existingUser = await getUserByEmail(user.email).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (existingUser) {
    throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, 'Email is linked to another account');
  }

  if (user.referralCode) {
    referrer = await getUserByReferralCode(user.referralCode).catch((error) => {
      throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
    });
    if (!referrer) {
      throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, 'Invalid referral code');
    }
  }

  const role = isVendor ? USER_ROLE.VENDOR : user.role;

  try {
    const password = await hashPassword(user.password);
    const savedUser = await new User({ ...user, password, referralCode, role }).save();

    await createNotification(NOTIFICATIONS.WELCOME_MESSAGE, savedUser._id);

    if (referrer) {
      await addReferral({
        userId: savedUser._id,
        referrerId: referrer._id,
        email: savedUser.email,
        status: REFERRAL_STATUS.REGISTERED,
      });
    }
    return generateToken(savedUser._id);
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error adding user', error);
  }
};

export const getUserInfo = async (key, value) => {
  const user = await User.aggregate([
    { $match: { [key]: value } },
    {
      $lookup: {
        from: 'properties',
        localField: 'assignedProperties.propertyId',
        foreignField: '_id',
        as: 'assignedProperties',
      },
    },
    {
      $lookup: {
        from: 'properties',
        localField: 'favorites',
        foreignField: '_id',
        as: 'favorites',
      },
    },
    {
      $lookup: {
        from: 'notifications',
        let: { userId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$userId', '$$userId'] }, { $eq: ['$read', false] }],
              },
            },
          },
        ],
        as: 'notifications',
      },
    },
    {
      $unwind: {
        path: '$notifications',
        preserveNullAndEmptyArrays: true,
      },
    },
    { $sort: { 'notifications.createdAt': -1 } },
    {
      $group: {
        _id: '$_id',
        notifications: { $push: '$notifications' },
        user: { $first: '$$ROOT' },
      },
    },
    {
      $project: {
        'user.password': 0,
        'user.assignedProperties.assignedTo': 0,
        'user.assignedProperties.addedBy': 0,
        'user.favorites.assignedTo': 0,
        'user.favorites.addedBy': 0,
        'user.favorites.updatedBy': 0,
      },
    },
  ]);

  return { ...user[0].user, notifications: user[0].notifications };
};

export const loginUser = async (user) => {
  const existingUser = await getUserByEmail(user.email, '+password').catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (existingUser) {
    const isMatch = await comparePassword(user.password, existingUser.password).catch((error) => {
      throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
    });

    if (isMatch) {
      const savedUser = existingUser.toJSON();
      const token = generateToken(savedUser._id);
      delete savedUser.password;

      if (savedUser.activated) {
        const userInfo = await getUserInfo('_id', savedUser._id);
        return { ...userInfo, token };
      }
      throw new ErrorHandler(httpStatus.UNAUTHORIZED, 'Your account needs to be activated.');
    }
    throw new ErrorHandler(httpStatus.UNAUTHORIZED, 'Invalid email or password');
  } else {
    throw new ErrorHandler(httpStatus.UNAUTHORIZED, 'Invalid email or password');
  }
};

export const activateUser = async (token) => {
  try {
    const decoded = await decodeToken(token);
    const user = await User.findOneAndUpdate(
      { _id: decoded.id },
      { $set: { activated: true, activationDate: Date.now() } },
      { new: true, fields: '-password' },
    );

    await createNotification(NOTIFICATIONS.ACCOUNT_ACTIVATED, user._id);

    await assignBadgeAutomatically(AUTOMATED_BADGES.ACTIVATED_USER, user._id);

    return user;
  } catch (error) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'User not found', error);
  }
};

export const assignPropertyToUser = async (toBeAssigned) => {
  const property = await getPropertyById(toBeAssigned.propertyId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (property.units < 1) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'No available units');
  }

  try {
    const updatedProperty = {
      id: property.id,
      $push: { assignedTo: toBeAssigned.userId },
      vendor: toBeAssigned.vendor,
    };
    const updatePropertyUnit = await updateProperty(updatedProperty).catch((error) => {
      throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
    });
    return updatePropertyUnit;
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error assigning property', error);
  }
};

export const forgotPasswordToken = async (email) => {
  const existingUser = await getUserByEmail(email).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (existingUser) {
    const savedUser = existingUser.toJSON();
    return { user: savedUser, token: generateToken(savedUser._id, '1h') };
  }
  throw new ErrorHandler(httpStatus.NOT_FOUND, 'Your email address is not found.');
};

export const resetPasswordViaToken = async (password, token) => {
  try {
    const decoded = await decodeToken(token);
    const hashedPassword = await hashPassword(password);
    const user = await User.findOneAndUpdate(
      { _id: decoded.id },
      { $set: { password: hashedPassword } },
      { new: true, fields: '-password' },
    );

    await createNotification(NOTIFICATIONS.CHANGED_PASSWORD, decoded.id);

    return user;
  } catch (error) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'User not found', error);
  }
};

export const updateUser = async (updatedUser) => {
  try {
    return User.findOneAndUpdate({ _id: updatedUser.id }, updatedUser, {
      new: true,
      fields: '-password',
    });
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error updating user', error);
  }
};

export const getAllUsers = async ({ page = 1, limit = 10, ...query } = {}) => {
  const { filterQuery, sortQuery } = buildFilterAndSortQuery(USER_FILTERS, query);

  const userOptions = [
    { $match: { $and: filterQuery } },
    { $sort: sortQuery },
    {
      $facet: {
        metadata: [{ $count: 'total' }, { $addFields: { page, limit } }],
        data: generateFacetData(page, limit),
      },
    },
    { $project: { preferences: 0, password: 0, notifications: 0 } },
  ];

  if (Object.keys(sortQuery).length === 0) {
    userOptions.splice(1, 1);
  }

  if (filterQuery.length < 1) {
    userOptions.shift();
  }

  const users = await User.aggregate(userOptions);
  const total = getPaginationTotal(users);
  const pagination = generatePagination(page, limit, total);
  const result = users[0].data;
  return { pagination, result };
};

export const addPropertyToFavorites = async (favorite) => {
  const property = await getPropertyById(favorite.propertyId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (!property) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Property not found');
  }

  try {
    return User.findByIdAndUpdate(favorite.userId, { $push: { favorites: favorite.propertyId } });
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error adding property to favorites', error);
  }
};

export const removePropertyFromFavorites = async (favorite) => {
  try {
    return User.findByIdAndUpdate(favorite.userId, { $pull: { favorites: favorite.propertyId } });
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error removing property from favorites', error);
  }
};

export const getAccountOverview = async (userId) => {
  const calculatedContributionReward = await calculateContributionReward(userId);
  const contributionReward =
    calculatedContributionReward.length > 0
      ? calculatedContributionReward[0].contributionReward
      : 0;

  const calculatedTotalAmountPaid = await getTotalAmountPaidByUser(userId);
  const totalAmountPaid =
    calculatedTotalAmountPaid.length > 0 ? calculatedTotalAmountPaid[0].totalAmountPaid : 0;

  const calculatedReferralRewards = await calculateReferralRewards(userId);
  const referralRewards =
    calculatedReferralRewards.length > 0 ? calculatedReferralRewards[0].referralRewards : 0;

  return {
    contributionReward,
    totalAmountPaid,
    referralRewards,
  };
};

export const upgradeUserToEditor = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'User not found');
  }
  try {
    return User.findByIdAndUpdate(
      userId,
      { $set: { role: USER_ROLE.EDITOR } },
      { new: true, fields: '-password' },
    );
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error upgrading user', error);
  }
};

export const downgradeEditorToUser = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'User not found');
  }
  try {
    return User.findByIdAndUpdate(
      userId,
      { $set: { role: USER_ROLE.USER } },
      { new: true, fields: '-password' },
    );
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error downgrading user', error);
  }
};

export const verifyVendorStep = async ({ vendorId, adminId, step }) => {
  const vendor = await getUserById(vendorId);

  if (!vendor) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'User not found');
  }

  if (vendor && vendor.role !== USER_ROLE.VENDOR) {
    throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, 'User is not a vendor');
  }

  const verificationInfo = {
    [`vendor.verification.${step}.status`]: VENDOR_INFO_STATUS.VERIFIED,
    [`vendor.verification.${step}.verifiedBy`]: adminId,
    [`vendor.verification.${step}.verifiedOn`]: getDateWithTimestamp(),
  };
  try {
    await User.findByIdAndUpdate(
      vendorId,
      { $set: verificationInfo },
      { new: true, fields: '-password' },
    );

    await User.updateMany(
      { [`vendor.verification.${step}.comments.status`]: COMMENT_STATUS.PENDING },
      {
        $set: {
          [`vendor.verification.${step}.comments.$[element].status`]: COMMENT_STATUS.RESOLVED,
        },
      },
      { arrayFilters: [{ 'element.status': COMMENT_STATUS.PENDING }] },
    );

    return getUserById(vendorId);
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, `Error verifying ${step}`, error);
  }
};

export const addCommentToVerificationStep = async ({ vendorId, adminId, step, comment }) => {
  const vendor = await getUserById(vendorId);

  if (!vendor) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'User not found');
  }

  if (vendor && vendor.role !== USER_ROLE.VENDOR) {
    throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, 'User is not a vendor');
  }

  const commentInfo = {
    comment,
    addedBy: adminId,
  };

  try {
    return User.findByIdAndUpdate(
      vendorId,
      {
        $push: { [`vendor.verification.${step}.comments`]: commentInfo },
        $set: { [`vendor.verification.${step}.status`]: VENDOR_INFO_STATUS.PENDING },
      },
      { new: true, fields: '-password' },
    );
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, `Error verifying ${step}`, error);
  }
};

export const verifyVendor = async ({ vendorId, adminId }) => {
  const vendor = await getUserById(vendorId);

  if (!vendor) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'User not found');
  }

  if (vendor && vendor.role !== USER_ROLE.VENDOR) {
    throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, 'User is not a vendor');
  }

  VENDOR_STEPS.map((step) => {
    if (vendor.vendor.verification[step].status !== VENDOR_INFO_STATUS.VERIFIED) {
      throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, `${step} has not been verified`);
    }
    return true;
  });

  try {
    const verifiedVendor = await User.findByIdAndUpdate(
      vendorId,
      {
        $set: {
          'vendor.verified': true,
          'vendor.verifiedBy': adminId,
          'vendor.verifiedOn': getDateWithTimestamp(),
        },
      },
      { new: true, fields: '-password' },
    );

    await createNotification(NOTIFICATIONS.VERIFY_VENDOR, vendor._id);

    await assignBadgeAutomatically(AUTOMATED_BADGES.VENDOR_VERIFIED, vendor._id);

    return verifiedVendor;
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error verifying vendor', error);
  }
};

const getStepsReadyForReview = (updatedVendor, user) => {
  const stepToReview = {
    verification: {},
  };

  if (
    updatedVendor.vendor &&
    updatedVendor.vendor.directors &&
    updatedVendor.vendor.directors.length > 0
  ) {
    stepToReview.verification.directorInfo = {
      ...user.vendor.verification.directorInfo,
      status: VENDOR_INFO_STATUS.IN_REVIEW,
    };
  }

  if (updatedVendor.vendor && updatedVendor.vendor.bankInfo) {
    stepToReview.verification.bankDetails = {
      ...user.vendor.verification.bankDetails,
      status: VENDOR_INFO_STATUS.IN_REVIEW,
    };
  }

  if (
    updatedVendor.vendor &&
    (updatedVendor.vendor.identification || updatedVendor.vendor.taxCertificate)
  ) {
    stepToReview.verification.documentUpload = {
      ...user.vendor.verification.documentUpload,
      status: VENDOR_INFO_STATUS.IN_REVIEW,
    };
  }

  if (
    updatedVendor.phone ||
    updatedVendor.phone2 ||
    updatedVendor.address ||
    (updatedVendor.vendor &&
      (updatedVendor.vendor.companyName ||
        updatedVendor.vendor.companyLogo ||
        updatedVendor.vendor.entity ||
        updatedVendor.vendor.redanNumber ||
        (updatedVendor.vendor.socialMedia && updatedVendor.vendor.socialMedia.length > 0) ||
        updatedVendor.vendor.website))
  ) {
    stepToReview.verification.companyInfo = {
      ...user.vendor.verification.companyInfo,
      status: VENDOR_INFO_STATUS.IN_REVIEW,
    };
  }

  return stepToReview;
};

const containsSensitiveInfo = (user) => {
  const sensitive = [
    'bankInfo',
    'companyName',
    'entity',
    'identification',
    'phone',
    'redanNumber',
    'taxCertificate',
  ];

  const updatedVendorInfo = Object.keys({ ...user, ...user.vendor });
  const updatedFields = sensitive.filter((element) => updatedVendorInfo.includes(element));

  return {
    status: updatedFields.length > 0,
    updatedFields,
  };
};

export const generateLog = ({ updatedFields, updatedVendor, user }) => {
  const oldValues = { ...user, ...user.vendor };
  const newValues = { ...updatedVendor, ...updatedVendor.vendor };
  const log = [];

  updatedFields.forEach((field) => {
    const oldValue = JSON.stringify(oldValues[field]);
    const newValue = JSON.stringify(newValues[field]);
    if (oldValue && oldValue !== newValue) {
      log.push({
        [field]: {
          old: oldValue,
          new: newValue,
        },
      });
    }
  });

  const updateDate = { updatedAt: getDateWithTimestamp() };

  return log.length > 0 ? Object.assign({}, updateDate, ...log) : null;
};

export const updateVendor = async ({ updatedVendor, user }) => {
  const stepToReview = getStepsReadyForReview(updatedVendor, user);

  if (
    updatedVendor.vendor &&
    updatedVendor.vendor.directors &&
    updatedVendor.vendor.directors.length > 0
  ) {
    Array.prototype.push.apply(updatedVendor.vendor.directors, user.vendor.directors);
  }

  if (
    updatedVendor.vendor &&
    updatedVendor.vendor.socialMedia &&
    updatedVendor.vendor.socialMedia.length > 0
  ) {
    Array.prototype.push.apply(updatedVendor.vendor.socialMedia, user.vendor.socialMedia);
  }

  const { updatedFields, status } = containsSensitiveInfo(updatedVendor);

  const log = generateLog({
    updatedFields,
    updatedVendor,
    user,
  });

  const logs = log ? [log, ...user.vendor.logs] : user.vendor.logs;

  const vendor = {
    ...user.vendor,
    ...updatedVendor.vendor,
    verified: status ? false : user.vendor.verified,
    logs,
  };

  vendor.verification = { ...vendor.verification, ...stepToReview.verification };

  try {
    return User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          phone: updatedVendor.phone ? updatedVendor.phone : user.phone,
          phone2: updatedVendor.phone2 ? updatedVendor.phone2 : user.phone2,
          address: updatedVendor.address
            ? { ...user.address, ...updatedVendor.address }
            : user.address,
          vendor,
        },
      },
      { new: true, fields: '-password' },
    );
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error updating vendor information', error);
  }
};

export const getOneUser = async (userId) =>
  User.aggregate([
    { $match: { _id: ObjectId(userId) } },
    {
      $lookup: {
        from: 'assignedbadges',
        localField: '_id',
        foreignField: 'userId',
        as: 'assignedBadges',
      },
    },
    {
      $lookup: {
        from: 'badges',
        localField: 'assignedBadges.badgeId',
        foreignField: '_id',
        as: 'badges',
      },
    },
    {
      $project: {
        password: 0,
        notifications: 0,
        preferences: 0,
      },
    },
  ]);

export const editDirector = async ({ directorInfo, user }) => {
  const vendorIsForDirector = user.vendor.directors.some(
    (director) => director._id.toString() === directorInfo._id.toString(),
  );

  if (!vendorIsForDirector) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Invalid director');
  }

  try {
    await User.findByIdAndUpdate(user._id, {
      $set: { 'vendor.verification.directorInfo.status': VENDOR_INFO_STATUS.IN_REVIEW },
    });
    return User.findOneAndUpdate(
      { 'vendor.directors._id': directorInfo._id },
      {
        $set: {
          'vendor.directors.$.name': directorInfo.name,
          'vendor.directors.$.phone': directorInfo.phone,
          'vendor.directors.$.isSignatory': directorInfo.isSignatory,
          'vendor.directors.$.signature': directorInfo.signature,
        },
      },
      { new: true, fields: '-password' },
    );
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error adding director', error);
  }
};

export const removeDirector = async ({ directorId, user }) => {
  let { directors } = user.vendor;

  directors = directors.filter((director) => director._id.toString() !== directorId.toString());

  const signatoryExists = directors.some((director) => director.isSignatory === true);

  if (!signatoryExists && user.vendor.verified) {
    throw new ErrorHandler(
      httpStatus.PRECONDITION_FAILED,
      'Signatory cannot be deleted. Verified vendors must have at least one signatory.',
    );
  }

  try {
    return User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          'vendor.directors': directors,
          'vendor.verification.directorInfo.status': user.vendor.verified
            ? user.vendor.verification.directorInfo.status
            : VENDOR_INFO_STATUS.IN_REVIEW,
        },
      },
      { new: true, fields: '-password' },
    );
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error removing director', error);
  }
};

export const certifyVendor = async ({ vendorId, adminId }) => {
  const user = await getUserById(vendorId);

  if (!user) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Vendor not found');
  }

  if (user.role !== USER_ROLE.VENDOR) {
    throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, 'User is not a registered vendor');
  }

  if (!user.vendor.verified) {
    throw new ErrorHandler(
      httpStatus.PRECONDITION_FAILED,
      `${user.vendor.companyName} must be verified before approval as a certified vendor`,
    );
  }

  try {
    const certifiedVendor = await User.findByIdAndUpdate(
      vendorId,
      {
        $set: {
          'vendor.certified': true,
          'vendor.certifiedBy': adminId,
          'vendor.certifiedOn': getDateWithTimestamp(),
        },
      },
      { new: true, fields: '-password' },
    );

    await createNotification(NOTIFICATIONS.CERTIFY_VENDOR, vendorId);

    await assignBadgeAutomatically(AUTOMATED_BADGES.VENDOR_CERTIFIED, vendorId);

    return certifiedVendor;
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error certifying vendor', error);
  }
};

export const resolveVerificationStepComment = async ({ vendorId, commentId, step }) => {
  const user = await getUserById(vendorId);

  if (!user) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'User not found');
  }

  if (user.role !== USER_ROLE.VENDOR) {
    throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, 'User is not a vendor');
  }

  const commentIdIsValid = user.vendor.verification[step].comments.some(
    (comment) => comment._id.toString() === commentId.toString(),
  );

  if (!commentIdIsValid) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Invalid comment id');
  }

  try {
    return User.findOneAndUpdate(
      { [`vendor.verification.${step}.comments._id`]: commentId },
      {
        $set: {
          [`vendor.verification.${step}.comments.$.status`]: COMMENT_STATUS.RESOLVED,
        },
      },
      { new: true, fields: '-password' },
    );
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error resolving comment', error);
  }
};

export const banUser = async ({ adminId, userId, reason }) => {
  const user = await getUserById(userId);

  if (!user) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'User not found');
  }

  try {
    const bannedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: { 'banned.status': true },
        $push: {
          'banned.case': {
            bannedBy: adminId,
            bannedDate: getDateWithTimestamp(),
            bannedReason: reason,
          },
        },
      },
      { new: true, fields: '-password' },
    );

    await createNotification(NOTIFICATIONS.BAN_USER, userId);

    return bannedUser;
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error banning user', error);
  }
};

export const unbanUser = async ({ adminId, userId, caseId, reason }) => {
  const user = await getUserById(userId);

  if (!user) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'User not found');
  }

  try {
    await User.findOneAndUpdate(
      { 'banned.case._id': caseId },
      {
        $set: {
          'banned.case.$.unBannedBy': adminId,
          'banned.case.$.unBannedDate': getDateWithTimestamp(),
          'banned.case.$.unBannedReason': reason,
        },
      },
    );

    const unbannedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { 'banned.status': false } },
      { new: true, fields: '-password' },
    );

    await createNotification(NOTIFICATIONS.UNBAN_USER, userId);

    return unbannedUser;
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error unbanning user', error);
  }
};

export const updateRemittancePercentage = async (remittanceInfo) => {
  const user = await getUserById(remittanceInfo.vendorId);

  if (!user) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'User not found');
  }

  try {
    return User.findByIdAndUpdate(
      user._id,
      { $set: { 'vendor.remittancePercentage': remittanceInfo.percentage } },
      { new: true, fields: '-password' },
    );
  } catch (error) {
    throw new ErrorHandler(
      httpStatus.BAD_REQUEST,
      'Error updating remittance percentage user',
      error,
    );
  }
};

export const requestBankDetails = async (userId) => {
  const user = await getUserById(userId);

  if (!user) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'User not found');
  }

  await createNotification(NOTIFICATIONS.REQUEST_BANK_DETAILS, userId);

  return user;
};

export const resendActivationEmail = async (userId) => {
  const user = await getUserById(userId);

  if (!user) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'User not found');
  }

  if (user.activated) {
    throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, 'Account has been previously activated');
  }
  return { user, token: generateToken(user._id) };
};

export const updateReferralPercentage = async ({ userId, percentage }) => {
  const user = await getUserById(userId);

  if (!user) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'User not found');
  }

  try {
    return User.findByIdAndUpdate(
      user._id,
      { $set: { 'additionalInfo.referralPercentage': percentage } },
      { new: true },
    );
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error updating referral percentage', error);
  }
};
