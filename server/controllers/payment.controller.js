import { initiatePaystackPayment } from '../services/payment.service';
import httpStatus from '../helpers/httpStatus';

const PaymentController = {
  paymentInitiation(req, res, next) {
    const { amount } = req.locals;
    const { user } = req;
    initiatePaystackPayment(amount, user.email)
      .then((payment) => {
        res
          .status(httpStatus.CREATED)
          .json({ success: true, message: 'Payment Initiation Successful', payment });
      })
      .catch((error) => next(error));
  },
};

export default PaymentController;
