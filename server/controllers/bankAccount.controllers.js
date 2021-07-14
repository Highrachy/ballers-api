import {
  addAccount,
  editAccount,
  getAllAccounts,
  approveAccount,
  deleteAccount,
} from '../services/bankAccount.service';
import httpStatus from '../helpers/httpStatus';

const BankAccountController = {
  addAccount(req, res, next) {
    const accountInfo = req.locals;
    addAccount({ ...accountInfo, addedBy: req.user._id })
      .then((account) => {
        res.status(httpStatus.CREATED).json({ success: true, message: 'Account added', account });
      })
      .catch((error) => next(error));
  },

  editAccount(req, res, next) {
    const accountInfo = req.locals;
    editAccount(accountInfo)
      .then((account) => {
        res.status(httpStatus.OK).json({ success: true, message: 'Account updated', account });
      })
      .catch((error) => next(error));
  },

  approveAccount(req, res, next) {
    const { id } = req.params;
    approveAccount({ accountId: id, approvedBy: req.user._id })
      .then((account) => {
        res.status(httpStatus.OK).json({ success: true, message: 'Account approved', account });
      })
      .catch((error) => next(error));
  },

  getAllAccounts(req, res, next) {
    const token = req.headers.authorization;
    getAllAccounts(token)
      .then((accounts) => {
        res.status(httpStatus.OK).json({ success: true, accounts });
      })
      .catch((error) => next(error));
  },

  deleteAccount(req, res, next) {
    const { id } = req.params;
    deleteAccount(id)
      .then(() => {
        res.status(httpStatus.OK).json({ success: true, message: 'Account deleted' });
      })
      .catch((error) => next(error));
  },
};

export default BankAccountController;
