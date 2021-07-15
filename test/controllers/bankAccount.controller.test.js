import mongoose from 'mongoose';
import { expect, request, sinon } from '../config';
import BankAccount from '../../server/models/bankAccount.model';
import BankAccountFactory from '../factories/bankAccount.factory';
import UserFactory from '../factories/user.factory';
import { addAccount } from '../../server/services/bankAccount.service';
import { addUser } from '../../server/services/user.service';
import { USER_ROLE } from '../../server/helpers/constants';
import {
  itReturnsForbiddenForNoToken,
  itReturnsForbiddenForTokenWithInvalidAccess,
  itReturnsErrorForEmptyFields,
  itReturnsAnErrorWhenServiceFails,
} from '../helpers';

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
    const endpoint = '/api/v1/account';
    const method = 'post';

    const account = {
      accountName: 'Highrachy Limited',
      accountNumber: '0987654321',
      bank: 'XYZ BAnk',
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
            expect(res.body.message).to.be.eql('Account added');
            expect(res.body.account.accountName).to.be.eql(account.accountName);
            expect(res.body.account.accountNumber).to.be.eql(account.accountNumber);
            expect(res.body.account.bank).to.be.eql(account.bank);
            expect(res.body.account.approved).to.be.eql(false);
            expect(res.body.account.addedBy).to.be.eql(adminUser._id.toString());
            done();
          });
      });
    });

    context('when account exists', () => {
      beforeEach(async () => {
        await addAccount({ ...account, addedBy: mongoose.Types.ObjectId() });
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
        bank: '"Bank" is not allowed to be empty',
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
    const endpoint = '/api/v1/account';
    const method = 'put';
    const account = BankAccountFactory.build(
      { addedBy: mongoose.Types.ObjectId() },
      { generateId: true },
    );

    const data = {
      id: account._id,
      accountName: 'Highrachy Limited',
      accountNumber: '0987654321',
      bank: 'XYZ BAnk',
    };

    beforeEach(async () => {
      await addAccount(account);
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
            expect(res.body.message).to.be.eql('Account updated');
            expect(res.body.account._id).to.be.eql(data.id.toString());
            expect(res.body.account.accountName).to.be.eql(data.accountName);
            expect(res.body.account.accountNumber).to.be.eql(data.accountNumber);
            expect(res.body.account.bank).to.be.eql(data.bank);
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

      context('when bank is empty', () => {
        it('returns an error', (done) => {
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send({ ...data, bank: '' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Bank" is not allowed to be empty');
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
    const endpoint = `/api/v1/account/approve/${account._id}`;
    const method = 'put';

    beforeEach(async () => {
      await addAccount(account);
    });

    context('when a valid token is used', () => {
      it('successfully updates account', (done) => {
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Account approved');
            expect(res.body.account._id).to.be.eql(account._id.toString());
            expect(res.body.account.approvedBy).to.be.eql(adminUser._id.toString());
            expect(res.body.account.approved).to.be.eql(true);
            done();
          });
      });
    });

    context('when account id is invalid', () => {
      const invalidId = mongoose.Types.ObjectId();
      it('returns not found', (done) => {
        request()
          [method](`/api/v1/account/approve/${invalidId}`)
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
    const endpoint = `/api/v1/account/${account._id}`;
    const method = 'delete';

    beforeEach(async () => {
      await addAccount(account);
    });

    context('when a valid token is used', () => {
      it('successfully deletes account', (done) => {
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Account deleted');
            done();
          });
      });
    });

    context('when account id is invalid', () => {
      it('returns not found', (done) => {
        request()
          [method](`/api/v1/account/${mongoose.Types.ObjectId()}`)
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
    const endpoint = '/api/v1/account/all';
    const method = 'get';
    let vendorToken;
    let userToken;

    const approvedAccounts = BankAccountFactory.buildList(
      5,
      { approved: true, addedBy: adminUser._id, approvedBy: adminUser._id },
      { generateId: true },
    );
    const unApprovedAccounts = BankAccountFactory.buildList(
      2,
      { approved: false, addedBy: adminUser._id },
      { generateId: true },
    );

    beforeEach(async () => {
      await BankAccount.insertMany([...approvedAccounts, ...unApprovedAccounts]);
    });

    context('when request is made by an admin', () => {
      it('returns all accounts', (done) => {
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.accounts.length).to.be.eql(
              approvedAccounts.length + unApprovedAccounts.length,
            );
            expect(res.body.accounts[0]._id).to.be.eql(approvedAccounts[0]._id.toString());
            expect(res.body.accounts[0].addedBy._id).to.be.eql(adminUser._id.toString());
            expect(res.body.accounts[0].approvedBy._id).to.be.eql(adminUser._id.toString());
            expect(res.body.accounts[0].addedBy).to.not.have.property('password');
            expect(res.body.accounts[0].approvedBy).to.not.have.property('password');
            done();
          });
      });
    });

    context('when non admin token is used', () => {
      beforeEach(async () => {
        vendorToken = await addUser(vendorUser);
        userToken = await addUser(regularUser);
      });
      [...new Array(2)].map((_, index) =>
        it('returns only approved accounts', (done) => {
          request()
            [method](endpoint)
            .set('authorization', [vendorToken, userToken][index])
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.accounts.length).to.be.eql(approvedAccounts.length);
              expect(res.body.accounts[0]._id).to.be.eql(approvedAccounts[0]._id.toString());
              expect(res.body.accounts[0].addedBy).to.be.eql(adminUser._id.toString());
              expect(res.body.accounts[0].approvedBy).to.be.eql(adminUser._id.toString());
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
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.accounts.length).to.be.eql(approvedAccounts.length);
            expect(res.body.accounts[0]._id).to.be.eql(approvedAccounts[0]._id.toString());
            expect(res.body.accounts[0].addedBy).to.be.eql(adminUser._id.toString());
            expect(res.body.accounts[0].approvedBy).to.be.eql(adminUser._id.toString());
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
