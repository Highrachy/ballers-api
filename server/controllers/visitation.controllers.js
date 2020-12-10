import { scheduleVisitation, getAllVisitations } from '../services/visitation.service';
import EMAIL_CONTENT from '../../mailer';
import { sendMail } from '../services/mailer.service';
import httpStatus from '../helpers/httpStatus';

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
    const { page, limit } = req.query;
    const { user } = req;
    getAllVisitations(user, page, limit)
      .then(({ result, pagination }) => {
        res.status(httpStatus.OK).json({ success: true, pagination, result });
      })
      .catch((error) => next(error));
  },
};

export default VisitationController;
