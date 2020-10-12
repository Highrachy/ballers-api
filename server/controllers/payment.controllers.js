import { initiatePaystackPayment, verifyPaystackPayment } from '../services/payment.service';
import httpStatus from '../helpers/httpStatus';
import { addTransaction, getTransactionByInfo } from '../services/transaction.service';

const PaymentController = {
  paymentInitiation(req, res, next) {
    const { amount, propertyId } = req.locals;
    const { user } = req;
    initiatePaystackPayment({ amount, user, propertyId })
      .then((payment) => {
        res
          .status(httpStatus.CREATED)
          .json({ success: true, message: 'Payment Initiation Successful', payment });
      })
      .catch((error) => next(error));
  },
  paymentVerification(req, res, next) {
    const { ref } = req.params;
    verifyPaystackPayment(ref)
      .then((payment) => {
        res
          .status(httpStatus.CREATED)
          .json({ success: true, message: 'Payment Verification Successful', payment });
      })
      .catch((error) => next(error));
  },
  async addPaymentToTransaction(req, res, next) {
    const { ref } = req.params;

    try {
      const refExists = await getTransactionByInfo(ref);
      if (refExists) {
        return res.json({ success: true, message: 'Payment has already been processed' });
      }

      const paystackResponse = await verifyPaystackPayment(ref);

      if (paystackResponse && paystackResponse.status === 'success') {
        const transaction = await addTransaction({
          [paystackResponse.metadata.custom_fields[0].variable_name]:
            paystackResponse.metadata.custom_fields[0].value,
          [paystackResponse.metadata.custom_fields[1].variable_name]:
            paystackResponse.metadata.custom_fields[1].value,
          [paystackResponse.metadata.custom_fields[2].variable_name]:
            paystackResponse.metadata.custom_fields[2].value,
          paymentSource: 'Paystack',
          amount: paystackResponse.amount / 100,
          additionalInfo: paystackResponse.reference,
          paidOn: paystackResponse.paid_at,
        });
        return res.json({
          success: true,
          message: 'Payment was successful',
          transaction,
          paystackResponse,
        });
      }
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ success: false, message: 'Your payment was not successful' });
    } catch (error) {
      next(error);
    }
    return null;
  },
};

export default PaymentController;
