import {
  scheduleVisitation,
  getAllVisitations,
  resolveVisitation,
  processVisitation,
} from '../services/visitation.service';
import EMAIL_CONTENT from '../../mailer';
import { sendMail } from '../services/mailer.service';
import httpStatus from '../helpers/httpStatus';
import { convertDateToLongHumanFormat } from '../helpers/dates';
import { getUserName, getFormattedPropertyName } from '../helpers/funtions';
import { PROCESS_VISITATION_ACTION } from '../helpers/constants';

const VisitationController = {
  book(req, res, next) {
    const booking = req.locals;
    const { user } = req;
    scheduleVisitation({ ...booking, userId: user._id })
      .then(({ schedule, vendor }) => {
        const contentBottom = `
          <strong> Name: </strong>: ${schedule.visitorName}<br />
          <strong> Phone: </strong> ${schedule.visitorPhone}<br />
          <strong> Email: </strong> ${
            schedule.visitorEmail ? schedule.visitorEmail : 'No email provided'
          } <br />
        `;
        sendMail(EMAIL_CONTENT.SCHEDULE_VISIT, vendor, { contentBottom });
        res
          .status(httpStatus.CREATED)
          .json({ success: true, message: 'Visit scheduled successfully', schedule });
      })
      .catch((error) => next(error));
  },

  getAll(req, res, next) {
    const { query } = req;
    const { user } = req;
    getAllVisitations(user, query)
      .then(({ result, pagination }) => {
        res.status(httpStatus.OK).json({ success: true, pagination, result });
      })
      .catch((error) => next(error));
  },

  resolveVisitation(req, res, next) {
    const { visitationId } = req.locals;
    const vendorId = req.user._id;
    resolveVisitation({ visitationId, vendorId })
      .then((visitation) => {
        res
          .status(httpStatus.OK)
          .json({ success: true, message: 'Visitation resolved', visitation });
      })
      .catch((error) => next(error));
  },

  rescheduleVisitation(req, res, next) {
    const visitationInfo = req.locals;
    const { user } = req;
    const action = PROCESS_VISITATION_ACTION.RESCHEDULE;
    processVisitation({ user, visitationInfo, action })
      .then(({ visitation, mailDetails, property }) => {
        const contentTop = `The visitation to ${getFormattedPropertyName(
          property,
        )} on ${convertDateToLongHumanFormat(
          visitation.rescheduleLog[0].rescheduleFrom,
        )}, has been rescheduled for ${convertDateToLongHumanFormat(
          visitation.visitDate,
        )} by ${getUserName(user)}. Reason: ${
          visitation.rescheduleLog[0].reason
        }. Visit your dashboard for more information.`;

        sendMail(EMAIL_CONTENT.RESCHEDULE_VISIT, mailDetails, { contentTop });
        res
          .status(httpStatus.OK)
          .json({ success: true, message: 'Visitation rescheduled', visitation });
      })
      .catch((error) => next(error));
  },

  cancelVisitation(req, res, next) {
    const visitationInfo = req.locals;
    const { user } = req;
    const action = PROCESS_VISITATION_ACTION.CANCEL;
    processVisitation({ user, visitationInfo, action })
      .then(({ visitation, mailDetails, property }) => {
        const contentTop = `The visitation to ${getFormattedPropertyName(
          property,
        )} on ${convertDateToLongHumanFormat(
          visitation.visitDate,
        )}, has been cancelled by ${getUserName(user)}. Reason: ${
          visitation.rescheduleLog[0].reason
        }. Visit your dashboard for more information.`;

        sendMail(EMAIL_CONTENT.CANCEL_VISIT, mailDetails, { contentTop });
        res
          .status(httpStatus.OK)
          .json({ success: true, message: 'Visitation cancelled', visitation });
      })
      .catch((error) => next(error));
  },
};

export default VisitationController;
