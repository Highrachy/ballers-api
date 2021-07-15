import mongoose from 'mongoose';
import querystring from 'querystring';
import { expect, request, sinon } from '../config';
import BankAccount from '../../server/models/bankAccount.model';
import BankAccountFactory from '../factories/bankAccount.factory';
import UserFactory from '../factories/user.factory';
import { addBankAccount } from '../../server/services/bankAccount.service';
import { addUser } from '../../server/services/user.service';
import { USER_ROLE } from '../../server/helpers/constants';
import {
  itReturnsForbiddenForNoToken,
  itReturnsForbiddenForTokenWithInvalidAccess,
  itReturnsErrorForEmptyFields,
  itReturnsAnErrorWhenServiceFails,
  itReturnsEmptyValuesWhenNoItemExistInDatabase,
  itReturnAllResultsWhenAnUnknownFilterIsUsed,
  defaultPaginationResult,
  expectsPaginationToReturnTheRightValues,
  itReturnsNoResultWhenNoFilterParameterIsMatched,
  filterTestForSingleParameter,
  futureDate,
  currentDate,
} from '../helpers';
import { BANK_ACCOUNT_FILTERS } from '../../server/helpers/filters';

let adminToken;

const regularUser = UserFactory.build(
  { role: USER_ROLE.USER, activated: true },
  { generateId: true },
);
const adminUser = UserFactory.build(
  { role: USER_ROLE.ADMIN, activated: true },
  { generateId: true },
);
const vendorUser = UserFactory.build(
  { role: USER_ROLE.VENDOR, activated: true },
  { generateId: true },
);

describe('Bank Account Controller', () => {
  beforeEach(async () => {
    adminToken = await addUser(adminUser);
  });

  describe('Add account route', () => {
    const endpoint = '/api/v1/bank-account';
    const method = 'post';

    const account = {
      accountName: 'Highrachy Limited',
      accountNumber: '0987654321',
      bankName: 'XYZ BAnk',
    };

    context('when a valid token is used', () => {
      it('successfully adds account', (done) => {
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .send(account)
          .end((err, res) => {
            expect(res).to.have.status(201);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Bank account added');
            expect(res.body.bankAccount.accountName).to.be.eql(account.accountName);
            expect(res.body.bankAccount.accountNumber).to.be.eql(account.accountNumber);
            expect(res.body.bankAccount.bankName).to.be.eql(account.bankName);
            expect(res.body.bankAccount.approved).to.be.eql(false);
            expect(res.body.bankAccount.addedBy).to.be.eql(adminUser._id.toString());
            done();
          });
      });
    });

    context('when account exists', () => {
      beforeEach(async () => {
        await addBankAccount({ ...account, addedBy: mongoose.Types.ObjectId() });
      });

      it('returns error', (done) => {
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .send(account)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Account already exists');
            done();
          });
      });
    });

    [vendorUser, regularUser].map((user) =>
      itReturnsForbiddenForTokenWithInvalidAccess({
        endpoint,
        method,
        user,
        data: account,
      }),
    );

    itReturnsForbiddenForNoToken({ endpoint, method, data: account });

    context('with invalid data', () => {
      const invalidEmptyData = {
        accountName: '"Account Name" is not allowed to be empty',
        accountNumber: '"Account Number" is not allowed to be empty',
        bankName: '"Bank Name" is not allowed to be empty',
      };

      itReturnsErrorForEmptyFields({
        endpoint,
        method,
        user: adminUser,
        data: invalidEmptyData,
        factory: BankAccountFactory,
        useExistingUser: true,
      });
    });
  });

  describe('Update account route', () => {
    const endpoint = '/api/v1/bank-account';
    const method = 'put';
    const account = BankAccountFactory.build(
      { addedBy: mongoose.Types.ObjectId() },
      { generateId: true },
    );

    const data = {
      id: account._id,
      accountName: 'Highrachy Limited',
      accountNumber: '0987654321',
      bankName: 'XYZ BAnk',
    };

    beforeEach(async () => {
      await addBankAccount(account);
    });

    context('when a valid token is used', () => {
      it('successfully updates account', (done) => {
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Bank account updated');
            expect(res.body.bankAccount._id).to.be.eql(data.id.toString());
            expect(res.body.bankAccount.accountName).to.be.eql(data.accountName);
            expect(res.body.bankAccount.accountNumber).to.be.eql(data.accountNumber);
            expect(res.body.bankAccount.bankName).to.be.eql(data.bankName);
            done();
          });
      });
    });

    context('when account id is invalid', () => {
      it('returns not found', (done) => {
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .send({ ...data, id: mongoose.Types.ObjectId() })
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Account not found');
            done();
          });
      });
    });

    context('when account is approved', () => {
      const approvedAccount = BankAccountFactory.build(
        { addedBy: mongoose.Types.ObjectId(), approved: true },
        { generateId: true },
      );

      beforeEach(async () => {
        await addBankAccount(approvedAccount);
      });

      it('returns error', (done) => {
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .send({ ...data, id: approvedAccount._id })
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Approved accounts cannot be edited');
            done();
          });
      });
    });

    [vendorUser, regularUser].map((user) =>
      itReturnsForbiddenForTokenWithInvalidAccess({
        endpoint,
        method,
        user,
        data,
      }),
    );

    itReturnsForbiddenForNoToken({ endpoint, method, data });

    context('with invalid data', () => {
      context('when id is empty', () => {
        it('returns an error', (done) => {
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send({ ...data, id: '' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Account Id" is not allowed to be empty');
              done();
            });
        });
      });

      context('when account name is empty', () => {
        it('returns an error', (done) => {
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send({ ...data, accountName: '' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Account Name" is not allowed to be empty');
              done();
            });
        });
      });

      context('when account number is empty', () => {
        it('returns an error', (done) => {
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send({ ...data, accountNumber: '' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Account Number" is not allowed to be empty');
              done();
            });
        });
      });

      context('when bank name is empty', () => {
        it('returns an error', (done) => {
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send({ ...data, bankName: '' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Bank Name" is not allowed to be empty');
              done();
            });
        });
      });
    });

    context('when update service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(BankAccount, 'findByIdAndUpdate').throws(new Error('Type Error'));
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            BankAccount.findByIdAndUpdate.restore();
          });
      });
    });
  });

  describe('Approve account route', () => {
    const account = BankAccountFactory.build(
      { addedBy: mongoose.Types.ObjectId(), approved: false },
      { generateId: true },
    );
    const endpoint = `/api/v1/bank-account/approve/${account._id}`;
    const method = 'put';

    beforeEach(async () => {
      await addBankAccount(account);
    });

    context('when a valid token is used', () => {
      it('successfully updates account', (done) => {
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Bank account approved');
            expect(res.body.bankAccount._id).to.be.eql(account._id.toString());
            expect(res.body.bankAccount.approvedBy).to.be.eql(adminUser._id.toString());
            expect(res.body.bankAccount.approved).to.be.eql(true);
            done();
          });
      });
    });

    context('when account id is invalid', () => {
      const invalidId = mongoose.Types.ObjectId();
      it('returns not found', (done) => {
        request()
          [method](`/api/v1/bank-account/approve/${invalidId}`)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Account not found');
            done();
          });
      });
    });

    [vendorUser, regularUser].map((user) =>
      itReturnsForbiddenForTokenWithInvalidAccess({
        endpoint,
        method,
        user,
      }),
    );

    itReturnsForbiddenForNoToken({ endpoint, method });

    context('when approval service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(BankAccount, 'findByIdAndUpdate').throws(new Error('Type Error'));
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            BankAccount.findByIdAndUpdate.restore();
          });
      });
    });
  });

  describe('Delete account route', () => {
    const account = BankAccountFactory.build(
      { addedBy: mongoose.Types.ObjectId() },
      { generateId: true },
    );
    const endpoint = `/api/v1/bank-account/${account._id}`;
    const method = 'delete';

    beforeEach(async () => {
      await addBankAccount(account);
    });

    context('when a valid token is used', () => {
      it('successfully deletes account', (done) => {
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Bank account deleted');
            done();
          });
      });
    });

    context('when account id is invalid', () => {
      it('returns not found', (done) => {
        request()
          [method](`/api/v1/bank-account/${mongoose.Types.ObjectId()}`)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Account not found');
            done();
          });
      });
    });

    [vendorUser, regularUser].map((user) =>
      itReturnsForbiddenForTokenWithInvalidAccess({
        endpoint,
        method,
        user,
      }),
    );

    itReturnsForbiddenForNoToken({ endpoint, method });

    context('when delete service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(BankAccount, 'findByIdAndDelete').throws(new Error('Type Error'));
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            BankAccount.findByIdAndDelete.restore();
          });
      });
    });
  });

  describe('Get all accounts route', () => {
    const endpoint = '/api/v1/bank-account/all';
    const method = 'get';
    let vendorToken;
    let userToken;

    const approvedAccounts = BankAccountFactory.buildList(
      18,
      { approved: true, addedBy: adminUser._id, approvedBy: adminUser._id, createdAt: currentDate },
      { generateId: true },
    );
    const unApprovedAccounts = BankAccountFactory.buildList(
      2,
      {
        approved: false,
        addedBy: adminUser._id,
        createdAt: futureDate,
        accountName: 'Blissvile Ltd',
        accountNumber: '2345678901',
        bankName: 'Second Bank Ltd',
      },
      { generateId: true },
    );

    beforeEach(async () => {
      vendorToken = await addUser(vendorUser);
      userToken = await addUser(regularUser);
    });

    describe('Pagination Tests', () => {
      context('when no bank account exists in db', () => {
        [adminUser, vendorUser, regularUser].map((user) =>
          itReturnsEmptyValuesWhenNoItemExistInDatabase({
            endpoint,
            method,
            user,
            useExistingUser: true,
          }),
        );
      });

      describe('when bank accounts exist in db', () => {
        beforeEach(async () => {
          await BankAccount.insertMany([...approvedAccounts, ...unApprovedAccounts]);
        });

        context('when non admin token is used', () => {
          [...new Array(2)].map((_, index) =>
            it('returns only approved accounts', (done) => {
              request()
                [method](endpoint)
                .set('authorization', [vendorToken, userToken][index])
                .end((err, res) => {
                  expectsPaginationToReturnTheRightValues(res, defaultPaginationResult);
                  expect(res.body.result[0]._id).to.be.eql(approvedAccounts[0]._id.toString());
                  expect(res.body.result[0]).to.not.have.property('addedBy');
                  expect(res.body.result[0]).to.not.have.property('approvedBy');
                  done();
                });
            }),
          );
        });

        context('when token is not used', () => {
          it('returns only approved accounts', (done) => {
            request()
              [method](endpoint)
              .end((err, res) => {
                expectsPaginationToReturnTheRightValues(res, defaultPaginationResult);
                expect(res.body.result[0]._id).to.be.eql(approvedAccounts[0]._id.toString());
                expect(res.body.result[0]).to.not.have.property('addedBy');
                expect(res.body.result[0]).to.not.have.property('approvedBy');
                done();
              });
          });
        });

        context('when request is made with admin token', () => {
          it('returns all accounts', (done) => {
            request()
              [method](endpoint)
              .set('authorization', adminToken)
              .end((err, res) => {
                expectsPaginationToReturnTheRightValues(res, {
                  ...defaultPaginationResult,
                  total: 20,
                });
                expect(res.body.result[0]._id).to.be.eql(approvedAccounts[0]._id.toString());
                expect(res.body.result[0].addedBy._id).to.be.eql(adminUser._id.toString());
                expect(res.body.result[0].approvedBy._id).to.be.eql(adminUser._id.toString());
                expect(res.body.result[0].addedBy).to.not.have.property('password');
                expect(res.body.result[0].approvedBy).to.not.have.property('password');
                done();
              });
          });
        });

        itReturnsAnErrorWhenServiceFails({
          endpoint,
          method,
          user: adminUser,
          model: BankAccount,
          modelMethod: 'aggregate',
          useExistingUser: true,
        });
      });
    });

    describe('Filter Tests', () => {
      beforeEach(async () => {
        await BankAccount.insertMany([...approvedAccounts, unApprovedAccounts[0]]);
      });

      describe('Unknown Filters', () => {
        const unknownFilter = {
          dob: '1993-02-01',
        };

        itReturnAllResultsWhenAnUnknownFilterIsUsed({
          filter: unknownFilter,
          method,
          endpoint,
          user: adminUser,
          expectedPagination: { ...defaultPaginationResult, total: 19 },
          useExistingUser: true,
        });
      });

      context('when multiple filters are used', () => {
        const multipleFilters = {
          accountName: unApprovedAccounts[0].accountName,
          accountNumber: unApprovedAccounts[0].accountNumber,
          approved: unApprovedAccounts[0].approved,
        };
        const filteredParams = querystring.stringify(multipleFilters);

        context('with admin token', () => {
          it('returns matched account', (done) => {
            request()
              [method](`${endpoint}?${filteredParams}`)
              .set('authorization', adminToken)
              .end((err, res) => {
                expectsPaginationToReturnTheRightValues(res, {
                  currentPage: 1,
                  limit: 10,
                  offset: 0,
                  result: 1,
                  total: 1,
                  totalPage: 1,
                });
                expect(res.body.result[0]._id).to.be.eql(unApprovedAccounts[0]._id.toString());
                expect(res.body.result[0].accountName).to.be.eql(multipleFilters.accountName);
                expect(res.body.result[0].accountNumber).to.be.eql(multipleFilters.accountNumber);
                expect(res.body.result[0].approved).to.be.eql(multipleFilters.approved);
                done();
              });
          });
        });

        context('without token', () => {
          it('returns only approved accounts', (done) => {
            request()
              [method](`${endpoint}?${filteredParams}`)
              .end((err, res) => {
                expectsPaginationToReturnTheRightValues(res, defaultPaginationResult);
                expect(res.body.result[0]._id).to.be.eql(approvedAccounts[0]._id.toString());
                expect(res.body.result[0]).to.not.have.property('addedBy');
                expect(res.body.result[0]).to.not.have.property('approvedBy');
                done();
              });
          });
        });

        context('when non admin token is used', () => {
          [...new Array(2)].map((_, index) =>
            it('returns only approved accounts', (done) => {
              request()
                [method](`${endpoint}?${filteredParams}`)
                .set('authorization', [vendorToken, userToken][index])
                .end((err, res) => {
                  expectsPaginationToReturnTheRightValues(res, defaultPaginationResult);
                  expect(res.body.result[0]._id).to.be.eql(approvedAccounts[0]._id.toString());
                  expect(res.body.result[0]).to.not.have.property('addedBy');
                  expect(res.body.result[0]).to.not.have.property('approvedBy');
                  done();
                });
            }),
          );
        });
      });

      context('when no parameter is matched', () => {
        const nonMatchingFilters = {
          createdAt: '2020-11-12',
          accountName: 'ASD Nig Limited',
          approved: false,
        };

        itReturnsNoResultWhenNoFilterParameterIsMatched({
          filter: nonMatchingFilters,
          method,
          endpoint,
          user: adminUser,
          useExistingUser: true,
        });
      });

      filterTestForSingleParameter({
        filter: BANK_ACCOUNT_FILTERS,
        method,
        endpoint,
        user: adminUser,
        dataObject: unApprovedAccounts[0],
        useExistingUser: true,
      });
    });
  });
});
