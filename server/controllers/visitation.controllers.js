import { scheduleVisitation, getAllVisitations } from '../services/visitation.service';
import EMAIL_CONTENT from '../../mailer';
import { sendMail } from '../services/mailer.service';
import httpStatus from '../helpers/httpStatus';

const BALLERS_EMAIL = process.env.BALLERS_EMAIL || 'dev@highrachy.com';

const VisitationController = {
  book(req, res, next) {
    const booking = req.locals;
    const { user } = req;
    scheduleVisitation({ ...booking, userId: user._id })
      .then((schedule) => {
        const contentBottom = `
          <strong> Name: </strong>: ${schedule.visitorName}<br>, 
          <strong> Phone: </strong> ${schedule.visitorPhone}<br>.
          <strong> Email: </strong> ${
            schedule.visitorEmail ? schedule.visitorEmail : 'no email provided'
          } <br>.
        `;
        sendMail(EMAIL_CONTENT.SCHEDULE_VISIT, { email: BALLERS_EMAIL }, { contentBottom });
        res
          .status(httpStatus.CREATED)
          .json({ success: true, message: 'Visit scheduled successfully', schedule });
      })
      .catch((error) => next(error));
  },
  getAll(req, res, next) {
    getAllVisitations()
      .then((schedules) => {
        if (schedules.length > 0) {
          res.status(httpStatus.OK).json({ success: true, schedules });
        } else {
          res
            .status(httpStatus.OK)
            .json({ success: true, message: 'No scheduled visits available', schedules });
        }
      })
      .catch((error) => next(error));
  },
};

export default VisitationController;
