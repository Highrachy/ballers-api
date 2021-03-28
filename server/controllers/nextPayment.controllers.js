import {
  getUnresolvedNextPayments,
  sendReminder,
  recalculateNextPayment,
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
    const { user } = req;
    recalculateNextPayment(offerId, user)
      .then((nextPayment) => {
        res
          .status(httpStatus.OK)
          .json({ success: true, message: 'Next payment recalculated', nextPayment });
      })
      .catch((error) => next(error));
  },
};

export default NextPaymentController;
