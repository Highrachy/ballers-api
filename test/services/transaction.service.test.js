import { expect, sinon } from '../config';
import {
  getTransactionById,
  addTransaction,
  getAllTransactions,
  getUserTransactionsByProperty,
  addRemittance,
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
import NextPayment from '../../server/models/nextPayment.model';
import { expectNewNotificationToBeAdded } from '../helpers';
import NOTIFICATIONS from '../../server/helpers/notifications';

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
    {
      enquiryId: enquiry._id,
      vendorId: vendor._id,
      totalAmountPayable: 4_000_000,
      initialPayment: 2_000_000,
      periodicPayment: 500_000,
      paymentFrequency: 30,
      initialPaymentDate: new Date('2020-03-01'),
    },
    { generateId: true },
  );
  const transaction = TransactionFactory.build(
    {
      addedBy: admin._id,
      updatedBy: admin._id,
      offerId: offer._id,
      propertyId: property._id,
      userId: user._id,
      amount: 1_000_000,
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
    beforeEach(async () => {
      await addTransaction(transaction);
    });

    it('returns a valid transaction by Id', async () => {
      const validTransaction = await getTransactionById(transaction._id);
      expect(validTransaction._id).to.be.eql(transaction._id);
    });
  });

  describe('#addTransaction', () => {
    let fakeDate;
    let countedTransactions;
    let countedNextPayments;

    const expiresOnForSecondCycle = new Date('2020-03-31');
    const expiresOnForLastCycle = new Date('2020-06-29');

    beforeEach(async () => {
      countedTransactions = await Transaction.countDocuments({});
      countedNextPayments = await NextPayment.countDocuments({});
    });

    afterEach(() => {
      fakeDate.restore();
    });

    context('when a valid transaction is entered', () => {
      context('during first payment cycle', () => {
        beforeEach(async () => {
          fakeDate = sinon.useFakeTimers({
            now: new Date('2020-02-21'),
          });
          await addTransaction({ ...transaction, amount: 2_000_000 });
        });

        it('adds a new transaction', async () => {
          const currentCountedTransactions = await Transaction.countDocuments({});
          const currentCountedNextPayments = await NextPayment.countDocuments({});
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(currentCountedTransactions).to.eql(countedTransactions + 1);
          expect(currentCountedNextPayments).to.eql(countedNextPayments + 1);
          expect(matchedNextPayments.length).to.eql(1);
          expect(matchedNextPayments[0].resolved).to.eql(false);
          expect(matchedNextPayments[0].expectedAmount).to.eql(500_000);
          expect(matchedNextPayments[0].expiresOn).to.eql(expiresOnForSecondCycle);
        });
      });

      context('during second payment cycle', () => {
        beforeEach(async () => {
          fakeDate = sinon.useFakeTimers({
            now: new Date('2020-03-08'),
          });
          await addTransaction({ ...transaction, amount: 2_300_000 });
        });

        it('adds a new transaction', async () => {
          const currentCountedTransactions = await Transaction.countDocuments({});
          const currentCountedNextPayments = await NextPayment.countDocuments({});
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(currentCountedTransactions).to.eql(countedTransactions + 1);
          expect(currentCountedNextPayments).to.eql(countedNextPayments + 1);
          expect(matchedNextPayments.length).to.eql(1);
          expect(matchedNextPayments[0].resolved).to.eql(false);
          expect(matchedNextPayments[0].expectedAmount).to.eql(200_000);
          expect(matchedNextPayments[0].expiresOn).to.eql(expiresOnForSecondCycle);
        });
      });

      context('during last payment cycle', () => {
        beforeEach(async () => {
          fakeDate = sinon.useFakeTimers({
            now: new Date('2020-06-8'),
          });
          await addTransaction({ ...transaction, amount: 3_500_000 });
        });

        it('adds a new transaction', async () => {
          const currentCountedTransactions = await Transaction.countDocuments({});
          const currentCountedNextPayments = await NextPayment.countDocuments({});
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(currentCountedTransactions).to.eql(countedTransactions + 1);
          expect(currentCountedNextPayments).to.eql(countedNextPayments + 1);
          expect(matchedNextPayments.length).to.eql(1);
          expect(matchedNextPayments[0].resolved).to.eql(false);
          expect(matchedNextPayments[0].expectedAmount).to.eql(500_000);
          expect(matchedNextPayments[0].expiresOn).to.eql(expiresOnForLastCycle);
        });
      });
    });

    context('when an invalid data is entered', () => {
      it('throws an error', async () => {
        try {
          const InvalidTransaction = TransactionFactory.build({
            addedBy: admin._id,
            updatedBy: admin._id,
            offerId: offer._id,
            userId: user._id,
            propertyId: '',
          });
          await addTransaction(InvalidTransaction);
        } catch (err) {
          const currentCountedTransactions = await Transaction.countDocuments({});
          expect(err.statusCode).to.eql(412);
          expect(err.message).to.be.eql('Property not for offer');
          expect(currentCountedTransactions).to.eql(countedTransactions);
        }
      });
    });
  });

  describe('#getAllTransactions', () => {
    let countedTransactions;
    const transactions = TransactionFactory.buildList(18, {
      propertyId: property._id,
      userId: user._id,
      vendorId: vendor._id,
      addedBy: admin._id,
      updatedBy: admin._id,
      offerId: offer._id,
    });
    const transactionToAdd = TransactionFactory.build({
      addedBy: admin._id,
      updatedBy: admin._id,
      offerId: offer._id,
      propertyId: property._id,
      userId: user._id,
    });

    beforeEach(async () => {
      await Transaction.insertMany(transactions);
    });
    context('when transaction added is valid', () => {
      it('returns 18 transactions', async () => {
        countedTransactions = await Transaction.countDocuments({});
        const multipleTransactions = await getAllTransactions(admin);
        expect(multipleTransactions.pagination.total).to.be.eql(countedTransactions);
        expect(multipleTransactions.pagination.currentPage).to.be.eql(1);
        expect(multipleTransactions.pagination.limit).to.be.eql(10);
        expect(multipleTransactions.pagination.offset).to.be.eql(0);
        expect(multipleTransactions.pagination.totalPage).to.be.eql(2);
      });
    });
    context('when new transaction is added', () => {
      beforeEach(async () => {
        await addTransaction(transactionToAdd);
      });
      it('returns 19 transactions', async () => {
        const multipleTransactions = await getAllTransactions(admin);
        expect(multipleTransactions.pagination.total).to.be.eql(countedTransactions + 1);
        expect(multipleTransactions.pagination.currentPage).to.be.eql(1);
        expect(multipleTransactions.pagination.limit).to.be.eql(10);
        expect(multipleTransactions.pagination.offset).to.be.eql(0);
        expect(multipleTransactions.pagination.totalPage).to.be.eql(2);
      });
    });
  });

  describe('#getUserTransactionsByProperty', () => {
    beforeEach(async () => {
      await addTransaction(transaction);
    });

    context('when transaction is updated', () => {
      it('returns a valid updated transaction', async () => {
        const searchResult = await getUserTransactionsByProperty(property._id, admin);
        expect(searchResult.result[0].propertyInfo._id).to.eql(property._id);
      });
    });
  });

  describe('#addRemittance', () => {
    const remittanceInfo = {
      transactionId: transaction._id,
      percentage: 5,
      adminId: admin._id,
      date: new Date('2020-11-11'),
    };

    context('when a valid data is entered', () => {
      beforeEach(async () => {
        await addTransaction(transaction);
      });

      context('when new notification is added', () => {
        beforeEach(async () => {
          await addRemittance(remittanceInfo);
        });

        expectNewNotificationToBeAdded(NOTIFICATIONS.REMITTANCE_PAID, vendor._id);
      });
    });
  });
});
