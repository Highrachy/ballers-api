import mongoose from 'mongoose';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
import { USER_ROLE, VISITATION_STATUS } from '../helpers/constants';
import Enquiry from '../models/enquiry.model';
import Offer from '../models/offer.model';
import OfflinePayment from '../models/offlinePayment.model';
import Property from '../models/property.model';
import Referral from '../models/referral.model';
import ReportedProperty from '../models/reportedProperty.model';
import Transaction from '../models/transaction.model';
import User from '../models/user.model';
import Visitation from '../models/visitation.model';

const { ObjectId } = mongoose.Types.ObjectId;

const getAllModels = async (user) => {
  let matchObject;
  let propertyMatchObject;
  let referralMatchObject;

  if (user.role === USER_ROLE.USER) {
    matchObject = { userId: ObjectId(user._id) };
    propertyMatchObject = { assignedTo: { $in: [ObjectId(user._id)] } };
    referralMatchObject = { userId: ObjectId(user._id) };
  } else if (user.role === USER_ROLE.VENDOR) {
    matchObject = { vendorId: ObjectId(user._id) };
    propertyMatchObject = { addedBy: ObjectId(user._id) };
    referralMatchObject = { userId: ObjectId(user._id) };
  } else {
    propertyMatchObject = {};
    referralMatchObject = {};
    matchObject = {};
  }
  try {
    const enquiries = await Enquiry.countDocuments(matchObject);
    const offers = await Offer.countDocuments(matchObject);
    const offlinePayments = await OfflinePayment.countDocuments(matchObject);
    const properties = await Property.countDocuments(propertyMatchObject);
    const referrals = await Referral.countDocuments(referralMatchObject);
    const reportedProperties = await ReportedProperty.countDocuments(matchObject);
    const scheduledVisitations = await Visitation.countDocuments({
      ...matchObject,
      status: VISITATION_STATUS.PENDING,
    });
    const transactions = await Transaction.countDocuments(matchObject);
    const users = await User.countDocuments(matchObject);

    const models = {
      enquiries,
      offers,
      offlinePayments,
      properties,
      referrals,
      reportedProperties,
      scheduledVisitations,
      transactions,
      users,
    };

    if (user.role === USER_ROLE.USER) {
      delete models.users;
    } else if (user.role === USER_ROLE.VENDOR) {
      delete models.users;
      delete models.reportedProperties;
      delete models.offlinePayments;
    }

    return models;
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error fetching models info', error);
  }
};

export default getAllModels;
