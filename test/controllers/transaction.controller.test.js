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
    adminId: _id,
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
      await addTransaction(TransactionFactory.build());
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

describe('Update Transaction route', () => {
  const transactionId = mongoose.Types.ObjectId();
  const transaction = TransactionFactory.build({ _id: transactionId, userId: _id, adminId: _id });

  beforeEach(async () => {
    await addTransaction(transaction);
  });

  const updatedTransaction = {
    transactionId,
    paidOn: '2020-05-05',
  };

  context('with valid token', () => {
    it('returns an updated transaction', (done) => {
      request()
        .put('/api/v1/transaction/update')
        .set('authorization', adminToken)
        .send(updatedTransaction)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.success).to.be.eql(true);
          expect(res.body.message).to.be.eql('Payment date updated');
          expect(res.body).to.have.property('transaction');
          expect(res.body.transaction.paidOn).to.be.eql(
            `${updatedTransaction.paidOn}T00:00:00.000Z`,
          );
          expect(res.body.transaction._id).to.be.eql(updatedTransaction.transactionId.toString());
          done();
        });
    });
  });

  context('without token', () => {
    it('returns error', (done) => {
      request()
        .put('/api/v1/transaction/update')
        .send(updatedTransaction)
        .end((err, res) => {
          expect(res).to.have.status(403);
          expect(res.body.success).to.be.eql(false);
          expect(res.body.message).to.be.eql('Token needed to access resources');
          done();
        });
    });
  });

  context('with invalid transaction', () => {
    it('returns validation error', (done) => {
      request()
        .put('/api/v1/transaction/update')
        .set('authorization', adminToken)
        .end((err, res) => {
          expect(res).to.have.status(412);
          expect(res.body.success).to.be.eql(false);
          expect(res.body.message).to.be.eql('Validation Error');
          done();
        });
    });
  });

  context('when update service returns an error', () => {
    it('returns the error', (done) => {
      sinon.stub(Transaction, 'findOneAndUpdate').throws(new Error('Type Error'));
      request()
        .put('/api/v1/transaction/update')
        .set('authorization', adminToken)
        .send(updatedTransaction)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body.success).to.be.eql(false);
          done();
          Transaction.findOneAndUpdate.restore();
        });
    });
  });

  context('with invalid data', () => {
    context('when transaction id is empty', () => {
      it('returns an error', (done) => {
        const invalidTransaction = { transactionId: '', paidOn: Date.now() };
        request()
          .put('/api/v1/transaction/update')
          .set('authorization', adminToken)
          .send(invalidTransaction)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Validation Error');
            expect(res.body.error).to.be.eql('"Transaction Id" is not allowed to be empty');
            done();
          });
      });
    });
    context('when paid on is empty', () => {
      it('returns an error', (done) => {
        const invalidTransaction = { transactionId, paidOn: '' };
        request()
          .put('/api/v1/transaction/update')
          .set('authorization', adminToken)
          .send(invalidTransaction)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Validation Error');
            expect(res.body.error).to.be.eql('"Payment Date" is not allowed to be empty');
            done();
          });
      });
    });
  });
});

describe('Get all transactions made by a user route', () => {
  const propertyId = mongoose.Types.ObjectId();
  const transactionId = mongoose.Types.ObjectId();
  const property = PropertyFactory.build({ _id: propertyId, addedBy: _id, updatedBy: _id });
  const transaction = TransactionFactory.build({
    _id: transactionId,
    propertyId,
    userId: _id,
    adminId: _id,
  });

  context('when no transaction is found', () => {
    it('returns empty array of transactions', (done) => {
      request()
        .get('/api/v1/transaction/personal')
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
          .get('/api/v1/transaction/personal')
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body).to.have.property('transactions');
            expect(res.body.transactions[0]._id).to.be.eql(transactionId.toString());
            expect(res.body.transactions[0].propertyInfo._id).to.be.eql(propertyId.toString());
            done();
          });
      });
    });

    context('without token', () => {
      it('returns error', (done) => {
        request()
          .get('/api/v1/transaction/personal')
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Token needed to access resources');
            done();
          });
      });
    });

    context('when user token is used', () => {
      it('returns successful payload', (done) => {
        request()
          .get('/api/v1/transaction/personal')
          .set('authorization', userToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            done();
          });
      });
    });

    context('when getTransactionsByUser service fails', () => {
      it('returns the error', (done) => {
        sinon.stub(Transaction, 'aggregate').throws(new Error('Type Error'));
        request()
          .get('/api/v1/transaction/personal')
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

describe('Get User Transactions By Property route', () => {
  const propertyId = mongoose.Types.ObjectId();
  const transactionId = mongoose.Types.ObjectId();
  const property = PropertyFactory.build({ _id: propertyId, addedBy: _id, updatedBy: _id });
  const transaction = TransactionFactory.build({
    _id: transactionId,
    propertyId,
    userId: _id,
    adminId: _id,
  });

  beforeEach(async () => {
    await addProperty(property);
    await addTransaction(transaction);
  });

  const propertyDetails = {
    propertyId,
  };

  context('with valid token', () => {
    it('returns an updated transaction', (done) => {
      request()
        .post('/api/v1/transaction/details')
        .set('authorization', adminToken)
        .send(propertyDetails)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.success).to.be.eql(true);
          expect(res.body).to.have.property('transactions');
          expect(res.body.transactions[0]._id).to.be.eql(transactionId.toString());
          expect(res.body.transactions[0].propertyInfo._id).to.be.eql(propertyId.toString());
          expect(res.body.transactions[0].userInfo._id).to.be.eql(_id.toString());
          done();
        });
    });
  });

  context('without token', () => {
    it('returns error', (done) => {
      request()
        .post('/api/v1/transaction/details')
        .send(propertyDetails)
        .end((err, res) => {
          expect(res).to.have.status(403);
          expect(res.body.success).to.be.eql(false);
          expect(res.body.message).to.be.eql('Token needed to access resources');
          done();
        });
    });
  });

  context('with invalid transaction', () => {
    it('returns validation error', (done) => {
      request()
        .post('/api/v1/transaction/details')
        .set('authorization', adminToken)
        .end((err, res) => {
          expect(res).to.have.status(412);
          expect(res.body.success).to.be.eql(false);
          expect(res.body.message).to.be.eql('Validation Error');
          done();
        });
    });
  });

  context('when getUserTransactionsByProperty service returns an error', () => {
    it('returns the error', (done) => {
      sinon.stub(Transaction, 'aggregate').throws(new Error('Type Error'));
      request()
        .post('/api/v1/transaction/details')
        .set('authorization', adminToken)
        .send(propertyDetails)
        .end((err, res) => {
          expect(res).to.have.status(500);
          done();
          Transaction.aggregate.restore();
        });
    });
  });
});
