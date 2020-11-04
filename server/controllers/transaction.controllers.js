import {
  addTransaction,
  getAllTransactions,
  updateTransaction,
  getUserTransactionsByProperty,
  getTransactionsByUser,
  getReferralRewards,
  getContributionRewards,
} from '../services/transaction.service';
import httpStatus from '../helpers/httpStatus';

const TransactionController = {
  add(req, res, next) {
    const newTransaction = req.locals;
    const { user } = req;
    addTransaction({ ...newTransaction, adminId: user._id })
      .then((transaction) => {
        res
          .status(httpStatus.CREATED)
          .json({ success: true, message: 'Transaction added', transaction });
      })
      .catch((error) => next(error));
  },

  getAll(req, res, next) {
    getAllTransactions()
      .then((transactions) => {
        res.status(httpStatus.OK).json({ success: true, transactions });
      })
      .catch((error) => next(error));
  },

  update(req, res, next) {
    const updatedInfo = req.locals;
    updateTransaction(updatedInfo)
      .then((transaction) => {
        res
          .status(httpStatus.OK)
          .json({ success: true, message: 'Payment date updated', transaction });
      })
      .catch((error) => next(error));
  },

  getAllPersonal(req, res, next) {
    const id = req.user._id;
    getTransactionsByUser(id)
      .then((transactions) => {
        res.status(httpStatus.OK).json({ success: true, transactions });
      })
      .catch((error) => next(error));
  },

  getTransactionsByProperty(req, res, next) {
    const propertyId = req.params.id;
    getUserTransactionsByProperty(propertyId)
      .then((transactions) => {
        res.status(httpStatus.OK).json({ success: true, transactions });
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
