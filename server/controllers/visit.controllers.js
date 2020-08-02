import scheduleVisit from '../services/visit.service';
// import { sendMail } from '../services/mailer.service';
// import EMAIL_CONTENT from '../../mailer';
import httpStatus from '../helpers/httpStatus';

const VisitController = {
  book(req, res, next) {
    const booking = req.locals;
    const { user } = req;
    scheduleVisit({ ...booking, visitorId: user._id })
      .then((schedule) => {
        // sendMail(EMAIL_CONTENT.ACTIVATE_YOUR_ACCOUNT, user, {
        //   link: `http://ballers.ng/activate?token=${token}`,
        // });
        res
          .status(httpStatus.CREATED)
          .json({ success: true, message: 'Visit scheduled successfully', schedule });
      })
      .catch((error) => next(error));
  },
};

export default VisitController;
