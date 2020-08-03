import scheduleVisitation from '../services/visitation.service';
// import { sendMail } from '../services/mailer.service';
// import EMAIL_CONTENT from '../../mailer';
import httpStatus from '../helpers/httpStatus';

const VisitationController = {
  book(req, res, next) {
    const booking = req.locals;
    const { user } = req;
    scheduleVisitation({ ...booking, userId: user._id })
      .then((schedule) => {
        // sendMail(EMAIL_CONTENT.SCHEDULE_VISIT, user, {
        //   link: `http://ballers.ng/activate?token=${token}`,
        // });
        res
          .status(httpStatus.CREATED)
          .json({ success: true, message: 'Visit scheduled successfully', schedule });
      })
      .catch((error) => next(error));
  },
};

export default VisitationController;
