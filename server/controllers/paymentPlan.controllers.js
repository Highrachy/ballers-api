import {
  addPaymentPlan,
  deletePaymentPlan,
  getAllPaymentPlans,
  updatePaymentPlan,
  assignPaymentPlanToProperty,
} from '../services/paymentPlan.service';
import httpStatus from '../helpers/httpStatus';

const PaymentPlanController = {
  add(req, res, next) {
    const newPaymentPlan = req.locals;
    const { user } = req;
    addPaymentPlan({ ...newPaymentPlan, addedBy: user._id })
      .then((plan) => {
        res.status(httpStatus.CREATED).json({ success: true, message: 'Plan added', plan });
      })
      .catch((error) => next(error));
  },

  delete(req, res, next) {
    const { id } = req.params;
    deletePaymentPlan(id)
      .then(() => {
        res.status(httpStatus.OK).json({ success: true, message: 'Plan deleted' });
      })
      .catch((error) => next(error));
  },

  getAll(req, res, next) {
    getAllPaymentPlans()
      .then((plans) => {
        res.status(httpStatus.OK).json({ success: true, plans });
      })
      .catch((error) => next(error));
  },

  update(req, res, next) {
    const updatedPaymentPlan = req.locals;
    const { user } = req;
    updatePaymentPlan({ ...updatedPaymentPlan, updatedBy: user._id })
      .then((plan) => {
        res.status(httpStatus.OK).json({ success: true, message: 'Payment plan updated', plan });
      })
      .catch((error) => next(error));
  },

  assignPaymentPlan(req, res, next) {
    const toBeAssigned = req.locals;
    assignPaymentPlanToProperty(toBeAssigned)
      .then(() => {
        res
          .status(httpStatus.OK)
          .json({ success: true, message: 'Payment plan assigned to property' });
      })
      .catch((error) => next(error));
  },
};

export default PaymentPlanController;
