import mongoose from 'mongoose';
import { expect, request, sinon, useDatabase } from '../config';
import Transaction from '../../server/models/transaction.model';
import TransactionFactory from '../factories/transaction.factory';
import { addTransaction } from '../../server/services/transaction.service';
import User from '../../server/models/user.model';
import UserFactory from '../factories/user.factory';
import { addUser } from '../../server/services/user.service';
import PropertyFactory from '../factories/property.factory';
import { addProperty } from '../../server/services/property.service';

useDatabase();

let adminToken;
let userToken;
const _id = mongoose.Types.ObjectId();
const adminUser = UserFactory.build({ _id, role: 0, activated: true });
const regualarUser = UserFactory.build({ role: 1, activated: true });

beforeEach(async () => {
  adminToken = await addUser(adminUser);
  userToken = await addUser(regualarUser);
});

describe('Add Transaction Route', () => {
  context('with valid data', () => {
    it('returns successful transaction', (done) => {
      const transaction = TransactionFactory.build();
      request()
        .post('/api/v1/transaction/add')
        .set('authorization', adminToken)
        .send(transaction)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body.success).to.be.eql(true);
          expect(res.body.message).to.be.eql('Transaction added');
          expect(res.body).to.have.property('transaction');
          done();
        });
    });
  });

  context('when user token is used', () => {
    beforeEach(async () => {
      await User.findByIdAndDelete(_id);
    });
    it('returns token error', (done) => {
      const transaction = TransactionFactory.build();
      request()
        .post('/api/v1/transaction/add')
        .set('authorization', adminToken)
        .send(transaction)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body.success).to.be.eql(false);
          expect(res.body.message).to.be.eql('Invalid token');
          done();
        });
    });
  });

  context('with invalid data', () => {
    context('when user id is empty', () => {
      it('returns an error', (done) => {
        const transaction = TransactionFactory.build({ userId: '' });
        request()
          .post('/api/v1/transaction/add')
          .set('authorization', adminToken)
          .send(transaction)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Validation Error');
            expect(res.body.error).to.be.eql('"User Id" is not allowed to be empty');
            done();
          });
      });
    });
    context('when property id is empty', () => {
      it('returns an error', (done) => {
        const transaction = TransactionFactory.build({ propertyId: '' });
        request()
          .post('/api/v1/transaction/add')
          .set('authorization', adminToken)
          .send(transaction)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Validation Error');
            expect(res.body.error).to.be.eql('"Property Id" is not allowed to be empty');
            done();
          });
      });
    });
    context('when payment source is empty', () => {
      it('returns an error', (done) => {
        const transaction = TransactionFactory.build({ paymentSource: '' });
        request()
          .post('/api/v1/transaction/add')
          .set('authorization', adminToken)
          .send(transaction)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Validation Error');
            expect(res.body.error).to.be.eql(
              '"Transaction Payment Source" is not allowed to be empty',
            );
            done();
          });
      });
    });
    context('when amount is empty', () => {
      it('returns an error', (done) => {
        const transaction = TransactionFactory.build({ amount: '' });
        request()
          .post('/api/v1/transaction/add')
          .set('authorization', adminToken)
          .send(transaction)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Validation Error');
            expect(res.body.error).to.be.eql('"Transaction Amount" must be a number');
            done();
          });
      });
    });
  });
});

describe('Get all transactions', () => {
  const propertyId = mongoose.Types.ObjectId();
  const transactionId = mongoose.Types.ObjectId();
  const property = PropertyFactory.build({ _id: propertyId, addedBy: _id, updatedBy: _id });
  const transaction = TransactionFactory.build({
    _id: transactionId,
    propertyId,
    userId: _id,
  });

  context('when no transaction is found', () => {
    it('returns empty array of transactions', (done) => {
      request()
        .get('/api/v1/transaction/all')
        .set('authorization', adminToken)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.success).to.be.eql(true);
          expect(res.body).to.have.property('transactions');
          expect(res.body.transactions.length).to.be.eql(0);
          done();
        });
    });
  });

  describe('when transactions exist in db', () => {
    before(async () => {
      await addProperty(property);
      await addTransaction(transaction);
    });

    context('with a valid token & id', async () => {
      it('returns successful payload', (done) => {
        request()
          .get('/api/v1/transaction/all')
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body).to.have.property('transactions');
            expect(res.body.transactions[0]._id).to.be.eql(transactionId.toString());
            expect(res.body.transactions[0].userInfo._id).to.be.eql(_id.toString());
            expect(res.body.transactions[0].propertyInfo._id).to.be.eql(propertyId.toString());
            done();
          });
      });
    });

    context('without token', () => {
      it('returns error', (done) => {
        request()
          .get('/api/v1/transaction/all')
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Token needed to access resources');
            done();
          });
      });
    });

    context('when user token is used', () => {
      it('returns forbidden error', (done) => {
        request()
          .get('/api/v1/transaction/all')
          .set('authorization', userToken)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('You are not permitted to perform this action');
            done();
          });
      });
    });

    context('when getAllTransactions service fails', () => {
      it('returns the error', (done) => {
        sinon.stub(Transaction, 'aggregate').throws(new Error('Type Error'));
        request()
          .get('/api/v1/transaction/all')
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(500);
            done();
            Transaction.aggregate.restore();
          });
      });
    });
  });
});
