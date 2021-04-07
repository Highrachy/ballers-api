import {
  addOfflinePayment,
  updateOfflinePayment,
  getAllOfflinePayments,
} from '../services/offlinePayment.service';
import httpStatus from '../helpers/httpStatus';

const OfflinePaymentController = {
  add(req, res, next) {
    const offlinePaymentInfo = req.locals;
    const userId = req.user._id;
    addOfflinePayment({ ...offlinePaymentInfo, userId })
      .then((payment) => {
        res
          .status(httpStatus.CREATED)
          .json({ success: true, message: 'Payment added successfully', payment });
      })
      .catch((error) => next(error));
  },

  update(req, res, next) {
    const offlinePaymentInfo = req.locals;
    const userId = req.user._id;
    updateOfflinePayment({ offlinePaymentInfo, userId })
      .then((payment) => {
        res.status(httpStatus.OK).json({ success: true, message: 'Payment updated', payment });
      })
      .catch((error) => next(error));
  },

  getAll(req, res, next) {
    const { user, query } = req;
    getAllOfflinePayments(user, query)
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

export default OfflinePaymentController;
