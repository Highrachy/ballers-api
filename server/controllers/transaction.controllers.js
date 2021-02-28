import {
  addTransaction,
  getAllTransactions,
  updateTransaction,
  getUserTransactionsByProperty,
  getReferralRewards,
  getContributionRewards,
  getOneTransaction,
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

  getOneTransaction(req, res, next) {
    const transactionId = req.params.id;
    const { user } = req;
    getOneTransaction(transactionId, user)
      .then((transaction) => {
        if (transaction.length > 0) {
          res.status(httpStatus.OK).json({ success: true, transaction: transaction[0] });
        } else {
          res
            .status(httpStatus.NOT_FOUND)
            .json({ success: false, message: 'Transaction not found' });
        }
      })
      .catch((error) => next(error));
  },
};

export default TransactionController;
