import {
  addOfflinePayment,
  updateOfflinePayment,
  getAllOfflinePayments,
  resolveOfflinePayment,
  makeComment,
  resolveComment,
} from '../services/offlinePayment.service';
import httpStatus from '../helpers/httpStatus';

const OfflinePaymentController = {
  add(req, res, next) {
    const offlinePaymentInfo = req.locals;
    addOfflinePayment(offlinePaymentInfo)
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
        res.status(httpStatus.OK).json({ success: true, message: 'Payment updateed', payment });
      })
      .catch((error) => next(error));
  },

  getAll(req, res, next) {
    getAllOfflinePayments(req.query)
      .then(({ pagination, result }) => {
        res.status(httpStatus.OK).json({
          success: true,
          pagination,
          result,
        });
      })
      .catch((error) => next(error));
  },

  resolveOfflinePayment(req, res, next) {
    const offlinePaymentId = req.params.id;
    const adminId = req.user._id;
    resolveOfflinePayment({ offlinePaymentId, adminId })
      .then((payment) => {
        res.status(httpStatus.OK).json({ success: true, message: 'Payment resolved', payment });
      })
      .catch((error) => next(error));
  },

  makeComment(req, res, next) {
    const comment = req.locals;
    const { user } = req;
    makeComment({ comment, user })
      .then(({ payment }) => {
        res.status(httpStatus.OK).json({ success: true, message: 'Comment raised', payment });
      })
      .catch((error) => next(error));
  },

  resolveComment(req, res, next) {
    const comment = req.locals;
    const { user } = req;
    resolveComment({ comment, user })
      .then(({ payment }) => {
        res.status(httpStatus.OK).json({ success: true, message: 'Comment resolved', payment });
      })
      .catch((error) => next(error));
  },
};

export default OfflinePaymentController;
