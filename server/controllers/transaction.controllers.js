import {
  addTransaction,
  getAllTransactions,
  updateTransaction,
  getUserTransactionsByPropertyAndUser,
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

  getUserTransactionsByPropertyAndUser(req, res, next) {
    const filter = req.locals;
    getUserTransactionsByPropertyAndUser(filter)
      .then((transactions) => {
        res.status(httpStatus.OK).json({ success: true, transactions });
      })
      .catch((error) => next(error));
  },
};

export default TransactionController;
