import { getUnresolvedNextPayments } from '../services/nextPayment.service';
import httpStatus from '../helpers/httpStatus';

const NextPaymentController = {
  getNextPayments(req, res, next) {
    const { user, query } = req;
    getUnresolvedNextPayments(user, query)
      .then(({ pagination, result }) => {
        res.status(httpStatus.OK).json({
          success: true,
          pagination,
          result,
        });
      })
      .catch((error) => next(error));
  },
};

export default NextPaymentController;
