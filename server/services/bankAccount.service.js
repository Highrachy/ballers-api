import BankAccount from '../models/bankAccount.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
import { USER_ROLE } from '../helpers/constants';
import { decodeToken, getUserById } from './user.service';
import { NON_PROJECTED_USER_INFO } from '../helpers/projectedSchemaInfo';
import { generatePagination, generateFacetData, getPaginationTotal } from '../helpers/pagination';
import { buildFilterAndSortQuery, BANK_ACCOUNT_FILTERS } from '../helpers/filters';

export const getBankAccountById = async (id) => BankAccount.findById(id).select();

export const getAccountByAccountNumber = async (accountNumber) =>
  BankAccount.find({ accountNumber });

export const addBankAccount = async (accountInfo) => {
  const accountExists = await getAccountByAccountNumber(accountInfo.accountNumber);

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

export const editBankAccount = async (updatedAccount) => {
  const account = await getBankAccountById(updatedAccount.id).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });
  if (!account) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Account not found');
  }

  if (account.approved) {
    throw new ErrorHandler(
      httpStatus.PRECONDITION_FAILED,
      'Approved bank accounts cannot be edited',
    );
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

export const approveBankAccount = async ({ accountId, approvedBy }) => {
  const account = await getBankAccountById(accountId).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });
  if (!account) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Account not found');
  }

  if (account.approved) {
    throw new ErrorHandler(httpStatus.PRECONDITION_FAILED, 'Account has been approved previously');
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

export const deleteBankAccount = async (id) => {
  const account = await getBankAccountById(id).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });
  if (!account) {
    throw new ErrorHandler(httpStatus.NOT_FOUND, 'Account not found');
  }

  try {
    return BankAccount.findByIdAndDelete(account._id);
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error deleting account', error);
  }
};

export const getAllBankAccounts = async (token = null, { page = 1, limit = 10, ...query } = {}) => {
  let accountOptions = [
    { $match: { approved: true } },
    {
      $project: {
        addedBy: 0,
        approvedBy: 0,
      },
    },
    {
      $facet: {
        metadata: [{ $count: 'total' }, { $addFields: { page, limit } }],
        data: generateFacetData(page, limit),
      },
    },
  ];

  if (token) {
    const decodedToken = await decodeToken(token);
    const user = await getUserById(decodedToken.id);

    if (user.role === USER_ROLE.ADMIN) {
      const { filterQuery, sortQuery } = buildFilterAndSortQuery(BANK_ACCOUNT_FILTERS, query);

      accountOptions = [
        { $match: { $and: filterQuery } },
        { $sort: sortQuery },
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
        {
          $unwind: {
            path: '$approvedBy',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            ...NON_PROJECTED_USER_INFO('addedBy'),
            ...NON_PROJECTED_USER_INFO('approvedBy'),
          },
        },
        {
          $facet: {
            metadata: [{ $count: 'total' }, { $addFields: { page, limit } }],
            data: generateFacetData(page, limit),
          },
        },
      ];

      if (Object.keys(sortQuery).length === 0) {
        accountOptions.splice(1, 1);
      }

      if (filterQuery.length < 1) {
        accountOptions.shift();
      }
    }
  }

  const accounts = await BankAccount.aggregate(accountOptions);

  const total = getPaginationTotal(accounts);
  const pagination = generatePagination(page, limit, total);
  return { pagination, result: accounts[0].data };
};
