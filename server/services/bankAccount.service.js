import BankAccount from '../models/bankAccount.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
import { USER_ROLE } from '../helpers/constants';
import { getOffersAttachedToAccount } from './offer.service';
import { decodeToken } from './user.service';
import { NON_PROJECTED_USER_INFO } from '../helpers/projectedSchemaInfo';

export const getAccountById = async (id) => BankAccount.findById(id).select();

export const getAccountByNameAndNumber = async ({ accountNumber, accountName }) =>
  BankAccount.find({ accountNumber, accountName }).collation({
    locale: 'en',
    strength: 2,
  });

export const addAccount = async (accountInfo) => {
  const accountExists = await getAccountByNameAndNumber({
    accountNumber: accountInfo.accountNumber,
    accountName: accountInfo.accountName,
  });

  if (accountExists.length > 0) {
    throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, 'Account already exists');
  }

  try {
    const addedAccount = await new BankAccount(accountInfo).save();
    return addedAccount;
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error adding account', error);
  }
};

export const editAccount = async (updatedAccount) => {
  const account = await getAccountById(updatedAccount.id).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });
  if (!account) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Account not found');
  }

  const accountPayload = {
    ...account.toObject(),
    ...updatedAccount,
  };

  try {
    return BankAccount.findByIdAndUpdate(account._id, accountPayload, { new: true });
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error updating account', error);
  }
};

export const approveAccount = async ({ accountId, approvedBy }) => {
  const account = await getAccountById(accountId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });
  if (!account) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Account not found');
  }

  try {
    return BankAccount.findByIdAndUpdate(
      account._id,
      { approved: true, approvedBy },
      { new: true },
    );
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error approving account', error);
  }
};

export const deleteAccount = async (id) => {
  const account = await getAccountById(id).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });
  if (!account) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Account not found');
  }

  const attachedOffers = await getOffersAttachedToAccount(account._id).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });

  if (attachedOffers.length > 0) {
    throw new ErrorHandler(
      httpStatus.PRECONDITION_FAILED,
      `Account is attached to ${attachedOffers.length} ${
        attachedOffers.length > 1 ? 'offers' : 'offer'
      }`,
    );
  }

  try {
    return BankAccount.findByIdAndDelete(account._id);
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error deleting account', error);
  }
};

export const getAllAccounts = async (token = null) => {
  let accountOptions = [{ $match: { approved: true } }];

  if (token) {
    const user = await decodeToken(token);
    if (user?.role === USER_ROLE.ADMIN) {
      accountOptions = [
        {
          $lookup: {
            from: 'users',
            localField: 'addedBy',
            foreignField: '_id',
            as: 'addedBy',
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'approvedBy',
            foreignField: '_id',
            as: 'approvedBy',
          },
        },
        { $unwind: '$addedBy' },
        { $unwind: '$approvedBy' },
        {
          $project: {
            ...NON_PROJECTED_USER_INFO('addedBy'),
            ...NON_PROJECTED_USER_INFO('approvedBy'),
          },
        },
      ];
    }
  }

  const accounts = await BankAccount.aggregate(accountOptions);

  return accounts;
};
