import mongoose from 'mongoose';
import { expect, useDatabase, sinon } from '../config';
import {
  getTransactionById,
  addTransaction,
  getAllTransactions,
  updateTransaction,
  getUserTransactionsByProperty,
  getTransactionsByUser,
} from '../../server/services/transaction.service';
import TransactionFactory from '../factories/transaction.factory';
import Transaction from '../../server/models/transaction.model';
import { addProperty } from '../../server/services/property.service';
import PropertyFactory from '../factories/property.factory';
import { addUser } from '../../server/services/user.service';
import UserFactory from '../factories/user.factory';

useDatabase();

describe('Transaction Service', () => {
  describe('#getTransactionById', () => {
    const id = mongoose.Types.ObjectId();

    before(async () => {
      await addTransaction(TransactionFactory.build({ _id: id, adminId: id }));
    });

    it('returns a valid transaction by Id', async () => {
      const transaction = await getTransactionById(id);
      expect(transaction._id).to.be.eql(id);
    });
  });

  describe('#addTransaction', () => {
    let countedTransactions;
    const id = mongoose.Types.ObjectId();
    const transaction = TransactionFactory.build({ adminId: id });

    beforeEach(async () => {
      countedTransactions = await Transaction.countDocuments({});
    });

    context('when a valid transaction is entered', () => {
      beforeEach(async () => {
        await addTransaction(transaction);
      });

      it('adds a new transaction', async () => {
        const currentCountedTransactions = await Transaction.countDocuments({});
        expect(currentCountedTransactions).to.eql(countedTransactions + 1);
      });
    });

    context('when an invalid data is entered', () => {
      it('throws an error', async () => {
        try {
          const InvalidTransaction = TransactionFactory.build({ propertyId: '' });
          await addTransaction(InvalidTransaction);
        } catch (err) {
          const currentCountedTransactions = await Transaction.countDocuments({});
          expect(err.statusCode).to.eql(400);
          expect(err.error.name).to.be.eql('ValidationError');
          expect(err.message).to.be.eql('Error adding transaction');
          expect(currentCountedTransactions).to.eql(countedTransactions);
        }
      });
    });
  });

  describe('#getAllTransactions', () => {
    const userId = mongoose.Types.ObjectId();
    const propertyId = mongoose.Types.ObjectId();
    const user = UserFactory.build({ _id: userId });
    const property = PropertyFactory.build({ _id: propertyId, addedBy: userId, updatedBy: userId });
    const transactionToAdd = TransactionFactory.build({ propertyId, userId, adminId: userId });

    beforeEach(async () => {
      await addUser(user);
      await addProperty(property);
      await addTransaction(transactionToAdd);
      await addTransaction(transactionToAdd);
    });
    context('when transaction added is valid', () => {
      it('returns 2 transactions', async () => {
        const transaction = await getAllTransactions();
        expect(transaction).to.be.an('array');
        expect(transaction.length).to.be.eql(2);
      });
    });
    context('when new transaction is added', () => {
      before(async () => {
        await addTransaction(transactionToAdd);
      });
      it('returns 3 transactions', async () => {
        const transaction = await getAllTransactions();
        expect(transaction).to.be.an('array');
        expect(transaction.length).to.be.eql(3);
      });
    });
  });

  describe('#updateTransaction', () => {
    const transactionId = mongoose.Types.ObjectId();
    const userId = mongoose.Types.ObjectId();
    const propertyId = mongoose.Types.ObjectId();
    const transactionToAdd = TransactionFactory.build({
      _id: transactionId,
      propertyId,
      userId,
      adminId: userId,
    });

    const updatedDetails = {
      transactionId,
      paidOn: Date.now(),
    };

    beforeEach(async () => {
      await addTransaction(transactionToAdd);
    });

    context('when transaction is updated', () => {
      it('returns a valid updated transaction', async () => {
        const updatedTransaction = updateTransaction(updatedDetails);
        const transaction = getTransactionById(updatedDetails.id);
        expect(transaction.amount).to.eql(updatedTransaction.amount);
        expect(transaction.paidOn).to.eql(updatedTransaction.paidOn);
      });
    });

    context('when getTransactionById fails', () => {
      it('throws an error', async () => {
        sinon.stub(Transaction, 'findById').throws(new Error('error msg'));
        try {
          await updateTransaction(updatedDetails);
        } catch (err) {
          expect(err.statusCode).to.eql(500);
          expect(err.error).to.be.an('Error');
          expect(err.message).to.be.eql('Internal Server Error');
        }
        Transaction.findById.restore();
      });
    });

    context('when findByIdAndUpdate fails', () => {
      it('throws an error', async () => {
        sinon.stub(Transaction, 'findByIdAndUpdate').throws(new Error('error msg'));
        try {
          await updateTransaction(updatedDetails);
        } catch (err) {
          expect(err.statusCode).to.eql(400);
          expect(err.error).to.be.an('Error');
          expect(err.message).to.be.eql('Error updating transaction');
        }
        Transaction.findByIdAndUpdate.restore();
      });
    });
  });

  describe('#getUserTransactionsByProperty', () => {
    const userId = mongoose.Types.ObjectId();
    const propertyId = mongoose.Types.ObjectId();
    const user = UserFactory.build({ _id: userId });
    const property = PropertyFactory.build({ _id: propertyId, addedBy: userId, updatedBy: userId });
    const transactionToAdd = TransactionFactory.build({
      propertyId,
      userId,
      adminId: userId,
    });

    beforeEach(async () => {
      await addUser(user);
      await addProperty(property);
      await addTransaction(transactionToAdd);
    });

    context('when transaction is updated', () => {
      it('returns a valid updated transaction', async () => {
        const searchResult = await getUserTransactionsByProperty(propertyId);
        expect(searchResult[0].propertyInfo._id).to.eql(propertyId);
      });
    });
  });

  describe('#getTransactionsByUser', () => {
    const userId = mongoose.Types.ObjectId();
    const propertyId = mongoose.Types.ObjectId();
    const user = UserFactory.build({ _id: userId });
    const property = PropertyFactory.build({ _id: propertyId, addedBy: userId, updatedBy: userId });
    const transactionToAdd = TransactionFactory.build({
      propertyId,
      userId,
      adminId: userId,
    });

    beforeEach(async () => {
      await addUser(user);
      await addProperty(property);
      await addTransaction(transactionToAdd);
    });

    context('when transaction is updated', () => {
      it('returns a valid updated transaction', async () => {
        const searchResult = await getTransactionsByUser(userId);
        expect(searchResult[0].propertyInfo._id).to.eql(propertyId);
        expect(searchResult[0].userId).to.eql(userId);
      });
    });
  });
});
