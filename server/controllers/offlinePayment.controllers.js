import {
  addOfflinePayment,
  resolveOfflinePayment,
  getAllOfflinePayments,
} from '../services/offlinePayment.service';
import httpStatus from '../helpers/httpStatus';

const OfflinePaymentController = {
  add(req, res, next) {
    const offlinePaymentInfo = req.locals;
    addOfflinePayment(offlinePaymentInfo)
      .then((offlinePayment) => {
        res
          .status(httpStatus.CREATED)
          .json({ success: true, message: 'Offline payment added successfully', offlinePayment });
      })
      .catch((error) => next(error));
  },

  resolve(req, res, next) {
    const offlinePaymentId = req.params.id;
    const adminId = req.user._id;
    resolveOfflinePayment({ offlinePaymentId, adminId })
      .then((offlinePayment) => {
        res
          .status(httpStatus.OK)
          .json({ success: true, message: 'Offline payment resolved', offlinePayment });
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
};

export default OfflinePaymentController;
