import mongoose from 'mongoose';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
import { USER_ROLE, VISITATION_STATUS, VALID_PORTFOLIO_OFFER } from '../helpers/constants';
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

const getTotalCount = async (user) => {
  let matchObject = {};
  let propertyMatchObject = {};
  let referralMatchObject = {};
  let reportedPropertyMatchObject = {};

  const portfolioMatchObject = { $or: VALID_PORTFOLIO_OFFER };

  if (user.role === USER_ROLE.USER) {
    matchObject = { userId: ObjectId(user._id) };
    propertyMatchObject = { assignedTo: { $in: [ObjectId(user._id)] } };
    referralMatchObject = { referrerId: ObjectId(user._id) };
    reportedPropertyMatchObject = { reportedBy: ObjectId(user._id) };
  } else if (user.role === USER_ROLE.VENDOR) {
    matchObject = { vendorId: ObjectId(user._id) };
    propertyMatchObject = { addedBy: ObjectId(user._id) };
    referralMatchObject = { referrerId: ObjectId(user._id) };
  }
  try {
    const enquiries = await Enquiry.countDocuments(matchObject);
    const offers = await Offer.countDocuments(matchObject);
    const portfolio = await Offer.countDocuments({ ...matchObject, ...portfolioMatchObject });
    const properties = await Property.countDocuments(propertyMatchObject);
    const referrals = await Referral.countDocuments(referralMatchObject);
    const scheduledVisitations = await Visitation.countDocuments({
      ...matchObject,
      status: VISITATION_STATUS.PENDING,
    });
    const transactions = await Transaction.countDocuments(matchObject);

    const models = {
      enquiries,
      offers,
      portfolio,
      properties,
      referrals,
      scheduledVisitations,
      transactions,
    };

    if (user.role === USER_ROLE.ADMIN || user.role === USER_ROLE.USER) {
      models.offlinePayments = await OfflinePayment.countDocuments(matchObject);
      models.reportedProperties = await ReportedProperty.countDocuments(
        reportedPropertyMatchObject,
      );
    }

    if (user.role === USER_ROLE.ADMIN) {
      models.users = await User.countDocuments(matchObject);
    }

    return models;
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error fetching total count', error);
  }
};

export default getTotalCount;
