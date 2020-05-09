import { initiatePaystackPayment } from '../services/payment.service';
import httpStatus from '../helpers/httpStatus';

const PaymentController = {
  register(req, res, next) {
    const paymentDetails = req.locals;
    initiatePaystackPayment(paymentDetails)
      .then((payment) => {
        res
          .status(httpStatus.CREATED)
          .json({ success: true, message: 'Payment Initiation Successful', payment });
      })
      .catch((error) => next(error));
  },
};

export default PaymentController;
