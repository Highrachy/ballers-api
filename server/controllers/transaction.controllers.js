import {
  getAllTransactions,
  getUserTransactionsByProperty,
  getReferralRewards,
  getContributionRewards,
  getOneTransaction,
  addRemittance,
} from '../services/transaction.service';
import httpStatus from '../helpers/httpStatus';

const TransactionController = {
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

  addRemittance(req, res, next) {
    const remittanceInfo = req.locals;
    const adminId = req.user._id;
    addRemittance({ ...remittanceInfo, adminId })
      .then((transaction) => {
        res.status(httpStatus.OK).json({ success: true, message: 'Remittance added', transaction });
      })
      .catch((error) => next(error));
  },
};

export default TransactionController;
