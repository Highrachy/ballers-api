import { addTransaction, getAllTransactions } from '../services/transaction.service';
import httpStatus from '../helpers/httpStatus';

const TransactionController = {
  add(req, res, next) {
    const newTransaction = req.locals;
    const { user } = req;
    if (newTransaction.userId) {
      newTransaction.adminId = user._id.toString();
    } else {
      newTransaction.userId = user._id.toString();
    }
    addTransaction(newTransaction)
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
};

export default TransactionController;
