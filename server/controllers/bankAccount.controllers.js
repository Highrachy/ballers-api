import {
  addBankAccount,
  editBankAccount,
  getAllBankAccounts,
  approveBankAccount,
  deleteBankAccount,
} from '../services/bankAccount.service';
import httpStatus from '../helpers/httpStatus';

const BankAccountController = {
  addBankAccount(req, res, next) {
    const accountInfo = req.locals;
    addBankAccount({ ...accountInfo, addedBy: req.user._id })
      .then((bankAccount) => {
        res
          .status(httpStatus.CREATED)
          .json({ success: true, message: 'Bank account added', bankAccount });
      })
      .catch((error) => next(error));
  },

  editBankAccount(req, res, next) {
    const accountInfo = req.locals;
    editBankAccount(accountInfo)
      .then((bankAccount) => {
        res
          .status(httpStatus.OK)
          .json({ success: true, message: 'Bank account updated', bankAccount });
      })
      .catch((error) => next(error));
  },

  approveBankAccount(req, res, next) {
    const { id } = req.params;
    approveBankAccount({ accountId: id, approvedBy: req.user._id })
      .then((bankAccount) => {
        res
          .status(httpStatus.OK)
          .json({ success: true, message: 'Bank account approved', bankAccount });
      })
      .catch((error) => next(error));
  },

  getAllBankAccounts(req, res, next) {
    const token = req.headers.authorization;
    const { query } = req;
    getAllBankAccounts(token, query)
      .then(({ result, pagination }) => {
        res.status(httpStatus.OK).json({ success: true, pagination, result });
      })
      .catch((error) => next(error));
  },

  deleteBankAccount(req, res, next) {
    const { id } = req.params;
    deleteBankAccount(id)
      .then(() => {
        res.status(httpStatus.OK).json({ success: true, message: 'Bank account deleted' });
      })
      .catch((error) => next(error));
  },
};

export default BankAccountController;
