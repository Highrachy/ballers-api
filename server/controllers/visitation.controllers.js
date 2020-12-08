import { scheduleVisitation, getAllVisitations } from '../services/visitation.service';
import EMAIL_CONTENT from '../../mailer';
import { sendMail } from '../services/mailer.service';
import httpStatus from '../helpers/httpStatus';

const VisitationController = {
  book(req, res, next) {
    const booking = req.locals;
    const { user } = req;
    scheduleVisitation({ ...booking, userId: user._id })
      .then(({ newSchedule, vendorEmail }) => {
        const contentBottom = `
          <strong> Name: </strong>: ${newSchedule.visitorName}<br /> 
          <strong> Phone: </strong> ${newSchedule.visitorPhone}<br />
          <strong> Email: </strong> ${
            newSchedule.visitorEmail ? newSchedule.visitorEmail : 'No email provided'
          } <br />
        `;
        sendMail(EMAIL_CONTENT.SCHEDULE_VISIT, { email: vendorEmail }, { contentBottom });
        res
          .status(httpStatus.CREATED)
          .json({ success: true, message: 'Visit scheduled successfully', schedule: newSchedule });
      })
      .catch((error) => next(error));
  },
  getAll(req, res, next) {
    getAllVisitations()
      .then((schedules) => {
        res.status(httpStatus.OK).json({ success: true, schedules });
      })
      .catch((error) => next(error));
  },
};

export default VisitationController;
