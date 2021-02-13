import { expect, sinon } from '../config';
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
import PropertyFactory from '../factories/property.factory';
import UserFactory from '../factories/user.factory';
import OfferFactory from '../factories/offer.factory';
import EnquiryFactory from '../factories/enquiry.factory';
import { addProperty } from '../../server/services/property.service';
import { addUser } from '../../server/services/user.service';
import { createOffer } from '../../server/services/offer.service';
import { addEnquiry } from '../../server/services/enquiry.service';
import { USER_ROLE } from '../../server/helpers/constants';

describe('Transaction Service', () => {
  const vendor = UserFactory.build({ role: USER_ROLE.VENDOR }, { generateId: true });
  const admin = UserFactory.build({ role: USER_ROLE.admin }, { generateId: true });
  const user = UserFactory.build({ role: USER_ROLE.USER }, { generateId: true });
  const property = PropertyFactory.build(
    { addedBy: vendor._id, updatedBy: vendor._id },
    { generateId: true },
  );
  const enquiry = EnquiryFactory.build(
    { userId: user._id, propertyId: property._id },
    { generateId: true },
  );
  const offer = OfferFactory.build(
    { enquiryId: enquiry._id, vendorId: vendor._id },
    { generateId: true },
  );
  const transaction = TransactionFactory.build(
    {
      adminId: admin._id,
      offerId: offer._id,
      propertyId: property._id,
      userId: user._id,
    },
    { generateId: true },
  );

  beforeEach(async () => {
    await addUser(vendor);
    await addUser(admin);
    await addUser(user);
    await addProperty(property);
    await addEnquiry(enquiry);
    await createOffer(offer);
  });

  describe('#getTransactionById', () => {
    before(async () => {
      await addTransaction(transaction);
    });

    it('returns a valid transaction by Id', async () => {
      const validTransaction = await getTransactionById(transaction._id);
      expect(validTransaction._id).to.be.eql(transaction._id);
    });
  });

  describe('#addTransaction', () => {
    let countedTransactions;

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
    const transactions = TransactionFactory.buildList(18, {
      propertyId: property._id,
      userId: user._id,
      adminId: admin._id,
    });
    const transactionToAdd = TransactionFactory.build({
      propertyId: property._id,
      userId: user._id,
      adminId: admin._id,
    });

    beforeEach(async () => {
      await Transaction.insertMany(transactions);
    });
    context('when transaction added is valid', () => {
      it('returns 18 transactions', async () => {
        const multipleTransactions = await getAllTransactions();
        expect(multipleTransactions).to.be.an('array');
        expect(multipleTransactions.length).to.be.eql(18);
      });
    });
    context('when new transaction is added', () => {
      before(async () => {
        await addTransaction(transactionToAdd);
      });
      it('returns 19 transactions', async () => {
        const multipleTransactions = await getAllTransactions();
        expect(multipleTransactions).to.be.an('array');
        expect(multipleTransactions.length).to.be.eql(19);
      });
    });
  });

  describe('#updateTransaction', () => {
    const updatedDetails = {
      transactionId: transaction._id,
      paidOn: Date.now(),
    };

    beforeEach(async () => {
      await addTransaction(transaction);
    });

    context('when transaction is updated', () => {
      it('returns a valid updated transaction', async () => {
        const updatedTransaction = updateTransaction(updatedDetails);
        const validTransaction = getTransactionById(updatedDetails.id);
        expect(validTransaction.amount).to.eql(updatedTransaction.amount);
        expect(validTransaction.paidOn).to.eql(updatedTransaction.paidOn);
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
    beforeEach(async () => {
      await addTransaction(transaction);
    });

    context('when transaction is updated', () => {
      it('returns a valid updated transaction', async () => {
        const searchResult = await getUserTransactionsByProperty(property._id);
        expect(searchResult[0].propertyInfo._id).to.eql(property._id);
      });
    });
  });

  describe('#getTransactionsByUser', () => {
    beforeEach(async () => {
      await addTransaction(transaction);
    });

    context('when transaction is updated', () => {
      it('returns a valid updated transaction', async () => {
        const searchResult = await getTransactionsByUser(user._id);
        expect(searchResult[0].propertyInfo._id).to.eql(property._id);
        expect(searchResult[0].userId).to.eql(user._id);
      });
    });
  });
});
