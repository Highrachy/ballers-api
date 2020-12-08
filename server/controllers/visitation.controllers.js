import { scheduleVisitation, getAllVisitations } from '../services/visitation.service';
import EMAIL_CONTENT from '../../mailer';
import { sendMail } from '../services/mailer.service';
import httpStatus from '../helpers/httpStatus';

const VisitationController = {
  book(req, res, next) {
    const booking = req.locals;
    const { user } = req;
    scheduleVisitation({ ...booking, userId: user._id })
      .then(({ schedule, vendorEmail }) => {
        const contentBottom = `
          <strong> Name: </strong>: ${schedule.visitorName}<br /> 
          <strong> Phone: </strong> ${schedule.visitorPhone}<br />
          <strong> Email: </strong> ${
            schedule.visitorEmail ? schedule.visitorEmail : 'No email provided'
          } <br />
        `;
        sendMail(EMAIL_CONTENT.SCHEDULE_VISIT, { email: vendorEmail }, { contentBottom });
        res
          .status(httpStatus.CREATED)
          .json({ success: true, message: 'Visit scheduled successfully', schedule });
      })
      .catch((error) => next(error));
  },

  getAll(req, res, next) {
    const userId = req.user._id;
    getAllVisitations(userId)
      .then((schedules) => {
        if (schedules.length > 0) {
          res.status(httpStatus.OK).json({ success: true, schedules });
        } else {
          res
            .status(httpStatus.NOT_FOUND)
            .json({ success: false, message: 'No schedules available' });
        }
      })
      .catch((error) => next(error));
  },
};

export default VisitationController;
