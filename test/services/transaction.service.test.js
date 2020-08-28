import mongoose from 'mongoose';
import { expect, useDatabase } from '../config';
import {
  getTransactionById,
  addTransaction,
  getAllTransactions,
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
      await addTransaction(TransactionFactory.build({ _id: id }));
    });

    it('returns a valid transaction by Id', async () => {
      const transaction = await getTransactionById(id);
      expect(transaction._id).to.be.eql(id);
    });
  });

  describe('#addTransaction', () => {
    let countedTransactions;
    const transaction = TransactionFactory.build();

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
});
