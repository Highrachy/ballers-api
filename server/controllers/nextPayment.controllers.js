import {
  getUnresolvedNextPayments,
  sendReminder,
  generateNextPaymentDate,
  cronjob,
} from '../services/nextPayment.service';
import httpStatus from '../helpers/httpStatus';
import EMAIL_CONTENT from '../../mailer';
import { sendMail } from '../services/mailer.service';
import { convertDateToLongHumanFormat } from '../helpers/dates';

const NextPaymentController = {
  getNextPayments(req, res, next) {
    const { user, query } = req;
    getUnresolvedNextPayments(user, query)
      .then(({ pagination, result }) => {
        res.status(httpStatus.OK).json({
          success: true,
          pagination,
          result,
        });
      })
      .catch((error) => next(error));
  },

  sendReminder(req, res, next) {
    sendReminder()
      .then((reminders) => {
        reminders.forEach((reminder) => {
          const contentTop = `This is a quick reminder that the periodic payment on your property ${
            reminder.propertyInfo.name
          }, is due on ${convertDateToLongHumanFormat(reminder.expiresOn)}.`;
          sendMail(EMAIL_CONTENT.PAYMENT_REMINDER, reminder.userInfo, { contentTop });
        });

        res.status(httpStatus.OK).json({
          success: true,
          message: `${reminders.length} ${reminders.length === 1 ? 'reminder' : 'reminders'} sent`,
        });
      })
      .catch((error) => next(error));
  },

  recalculateNextPayment(req, res, next) {
    const offerId = req.params.id;
    generateNextPaymentDate({ offerId })
      .then((nextPayment) => {
        if (Object.keys(nextPayment).length === 0) {
          res
            .status(httpStatus.PRECONDITION_FAILED)
            .json({ success: false, message: 'Offer has been completed' });
        } else {
          res
            .status(httpStatus.OK)
            .json({ success: true, message: 'Next payment recalculated', nextPayment });
        }
      })
      .catch((error) => next(error));
  },

  cronjob(req, res, next) {
    cronjob()
      .then((numberResolved) => {
        res.status(httpStatus.OK).json({
          success: true,
          message: `${numberResolved} next ${
            numberResolved === 1 ? 'payment' : 'payments'
          } processed`,
        });
      })
      .catch((error) => next(error));
  },
};

export default NextPaymentController;
