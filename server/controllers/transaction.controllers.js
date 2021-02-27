import {
  addTransaction,
  getAllTransactions,
  updateTransaction,
  getUserTransactionsByProperty,
  getReferralRewards,
  getContributionRewards,
} from '../services/transaction.service';
import httpStatus from '../helpers/httpStatus';

const TransactionController = {
  add(req, res, next) {
    const newTransaction = req.locals;
    const { user } = req;
    addTransaction({ ...newTransaction, addedBy: user._id, updatedBy: user._id })
      .then((transaction) => {
        res
          .status(httpStatus.CREATED)
          .json({ success: true, message: 'Transaction added', transaction });
      })
      .catch((error) => next(error));
  },

  update(req, res, next) {
    const updatedInfo = req.locals;
    const { user } = req;
    updateTransaction({ ...updatedInfo, updatedBy: user._id })
      .then((transaction) => {
        res
          .status(httpStatus.OK)
          .json({ success: true, message: 'Payment date updated', transaction });
      })
      .catch((error) => next(error));
  },

  getAll(req, res, next) {
    const { user } = req;
    const { page, limit } = req.query;
    getAllTransactions(user, page, limit)
      .then(({ pagination, result }) => {
        res.status(httpStatus.OK).json({
          success: true,
          pagination,
          result,
        });
      })
      .catch((error) => next(error));
  },

  getTransactionsByProperty(req, res, next) {
    const propertyId = req.params.id;
    const { user } = req;
    const { page, limit } = req.query;
    getUserTransactionsByProperty(propertyId, user, page, limit)
      .then(({ pagination, result }) => {
        res.status(httpStatus.OK).json({
          success: true,
          pagination,
          result,
        });
      })
      .catch((error) => next(error));
  },

  getContributionRewards(req, res, next) {
    const userId = req.user._id;
    getContributionRewards(userId)
      .then((contributionRewards) => {
        res.status(httpStatus.OK).json({ success: true, contributionRewards });
      })
      .catch((error) => next(error));
  },

  getReferralRewards(req, res, next) {
    const userId = req.user._id;
    getReferralRewards(userId)
      .then((referralRewards) => {
        res.status(httpStatus.OK).json({ success: true, referralRewards });
      })
      .catch((error) => next(error));
  },
};

export default TransactionController;
