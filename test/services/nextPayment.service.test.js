import mongoose from 'mongoose';
import { expect, sinon } from '../config';
import NextPayment from '../../server/models/nextPayment.model';
import Offer from '../../server/models/offer.model';
import Transaction from '../../server/models/transaction.model';
import { generateNextPaymentDate } from '../../server/services/nextPayment.service';
import OfferFactory from '../factories/offer.factory';
import NextPaymentFactory from '../factories/nextPayment.factory';
import TransactionFactory from '../factories/transaction.factory';

describe('NextPayment Service', () => {
  const offer = OfferFactory.build(
    {
      totalAmountPayable: 10_000_000,
      initialPayment: 2_000_000,
      periodicPayment: 500_000,
      paymentFrequency: 30,
      initialPaymentDate: new Date('2020-03-01'),
      referenceCode: 'HIG/P/OLP/02/28022021',
      propertyId: mongoose.Types.ObjectId(),
      vendorId: mongoose.Types.ObjectId(),
      userId: mongoose.Types.ObjectId(),
    },
    { generateId: true },
  );

  const transaction = TransactionFactory.build(
    {
      addedBy: mongoose.Types.ObjectId(),
      updatedBy: mongoose.Types.ObjectId(),
      offerId: offer._id,
      propertyId: mongoose.Types.ObjectId(),
      userId: mongoose.Types.ObjectId(),
      vendorId: mongoose.Types.ObjectId(),
      amount: 1_000_000,
    },
    { generateId: true },
  );

  const nextPayment = NextPaymentFactory.build({ offerId: offer._id }, { generateId: true });

  describe('#generateNextPaymentDate', () => {
    let fakeDate;
    beforeEach(async () => {
      await Offer.create(offer);
    });

    afterEach(() => {
      fakeDate.restore();
    });

    context('when nextPayment exists', () => {
      beforeEach(async () => {
        fakeDate = sinon.useFakeTimers({
          now: new Date('2020-03-20'),
        });
        await NextPayment.create(nextPayment);
      });

      context('with an initial transaction of 2 million', () => {
        beforeEach(async () => {
          await Transaction.create({ ...transaction, amount: 2_000_000 });
          await generateNextPaymentDate({ offerId: offer._id, transactionId: transaction._id });
        });

        it('returns zero as expected balance', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments[0].resolved).to.eql(true);
          expect(matchedNextPayments[0].resolvedViaTransaction).to.eql(true);
          expect(matchedNextPayments[0].transactionId).to.eql(transaction._id);
          expect(matchedNextPayments[1].resolved).to.eql(false);
          expect(matchedNextPayments[1].expectedAmount).to.eql(0);
          expect(matchedNextPayments[1].expiresOn).to.eql(new Date('2020-03-31'));
        });
      });

      context('with an initial transaction of 10.5 million', () => {
        beforeEach(async () => {
          await Transaction.create({ ...transaction, amount: 10_500_000 });
          await generateNextPaymentDate({ offerId: offer._id, transactionId: transaction._id });
        });

        it('does not add a new nextPayment', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments.length).to.eql(1);
          expect(matchedNextPayments[0].resolved).to.eql(true);
          expect(matchedNextPayments[0].resolvedViaTransaction).to.eql(true);
          expect(matchedNextPayments[0].transactionId).to.eql(transaction._id);
        });
      });

      context('with an initial transaction 10 million', () => {
        beforeEach(async () => {
          await Transaction.create({ ...transaction, amount: 10_000_000 });
          await generateNextPaymentDate({ offerId: offer._id, transactionId: transaction._id });
        });

        it('does not add a new nextPayment', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments.length).to.eql(1);
          expect(matchedNextPayments[0].resolved).to.eql(true);
          expect(matchedNextPayments[0].resolvedViaTransaction).to.eql(true);
          expect(matchedNextPayments[0].transactionId).to.eql(transaction._id);
        });
      });
    });

    context('when previous nextPayment does not exist', () => {
      beforeEach(async () => {
        fakeDate = sinon.useFakeTimers({
          now: new Date('2020-03-20'),
        });
      });

      context('when a previous transaction does not exist', () => {
        beforeEach(async () => {
          await generateNextPaymentDate({ offerId: offer._id });
        });

        it('adds a new nextPayment', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments[0].expectedAmount).to.eql(2_000_000);
          expect(matchedNextPayments[0].resolved).to.eql(false);
          expect(matchedNextPayments[0].expiresOn).to.eql(new Date('2020-03-31'));
        });
      });

      context('with an initial transaction of 2.5 million', () => {
        beforeEach(async () => {
          await Transaction.create({ ...transaction, amount: 2_500_000 });
          await generateNextPaymentDate({ offerId: offer._id });
        });

        it('shows user has paid in excess', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments[0].expectedAmount).to.eql(-500_000);
          expect(matchedNextPayments[0].resolved).to.eql(false);
          expect(matchedNextPayments[0].expiresOn).to.eql(new Date('2020-03-31'));
        });
      });
    });

    context('when a previous transaction does not exist', () => {
      context('when previous nextPayment does not exist', () => {
        context('when service runs in second payment cycle', () => {
          beforeEach(async () => {
            fakeDate = sinon.useFakeTimers({
              now: new Date('2020-04-05'),
            });
            await generateNextPaymentDate({ offerId: offer._id });
          });

          it('returns total expected amount for both cycles', async () => {
            const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
            expect(matchedNextPayments[0].resolved).to.eql(false);
            expect(matchedNextPayments[0].expectedAmount).to.eql(2_500_000);
            expect(matchedNextPayments[0].expiresOn).to.eql(new Date('2020-04-30'));
          });
        });
      });

      context('with an initial transaction of 1 million', () => {
        beforeEach(async () => {
          fakeDate = sinon.useFakeTimers({
            now: new Date('2020-03-20'),
          });
          await Transaction.create({ ...transaction, amount: 1_000_000 });
          await generateNextPaymentDate({ offerId: offer._id });
        });

        it('returns payment with pending balance', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments[0].resolved).to.eql(false);
          expect(matchedNextPayments[0].expectedAmount).to.eql(1_000_000);
          expect(matchedNextPayments[0].expiresOn).to.eql(new Date('2020-03-31'));
        });
      });
    });
  });
});
