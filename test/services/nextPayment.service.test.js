import mongoose from 'mongoose';
import { expect, sinon } from '../config';
import NextPayment from '../../server/models/nextPayment.model';
import Offer from '../../server/models/offer.model';
import Transaction from '../../server/models/transaction.model';
import { generateNextPaymentDate } from '../../server/services/nextPayment.service';
import OfferFactory from '../factories/offer.factory';
import NextPaymentFactory from '../factories/nextPayment.factory';
import TransactionFactory from '../factories/transaction.factory';

describe.only('NextPayment Service', () => {
  const offer = OfferFactory.build(
    {
      totalAmountPayable: 4_000_000,
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

    describe('Payment schedule is in the first cycle', () => {
      beforeEach(async () => {
        fakeDate = sinon.useFakeTimers({
          now: new Date('2020-03-20'),
        });
      });

      context('when a previous nextPayment record exists', () => {
        beforeEach(async () => {
          await NextPayment.create(nextPayment);
          await generateNextPaymentDate({ offerId: offer._id });
        });

        it('returns 2 million as expected balance', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments.length).to.eql(2);
          expect(matchedNextPayments[0]._id).to.eql(nextPayment._id);
          expect(matchedNextPayments[0].resolved).to.eql(true);
          expect(matchedNextPayments[0].resolvedViaTransaction).to.eql(false);
          expect(matchedNextPayments[1].resolved).to.eql(false);
          expect(matchedNextPayments[1].expectedAmount).to.eql(2_000_000);
          expect(matchedNextPayments[1].expiresOn).to.eql(new Date('2020-03-31'));
        });
      });

      context('when a previous nextPayment record does not exist', () => {
        beforeEach(async () => {
          await generateNextPaymentDate({ offerId: offer._id });
        });

        it('returns 2 million as expected balance', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments.length).to.eql(1);
          expect(matchedNextPayments[0].resolved).to.eql(false);
          expect(matchedNextPayments[0].expectedAmount).to.eql(2_000_000);
          expect(matchedNextPayments[0].expiresOn).to.eql(new Date('2020-03-31'));
        });
      });

      context('when a user pays less than initial payment', () => {
        beforeEach(async () => {
          await Transaction.create(transaction);
          await generateNextPaymentDate({ offerId: offer._id });
        });

        it('returns 1 million as expected balance', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments.length).to.eql(1);
          expect(matchedNextPayments[0].resolved).to.eql(false);
          expect(matchedNextPayments[0].expectedAmount).to.eql(1_000_000);
          expect(matchedNextPayments[0].expiresOn).to.eql(new Date('2020-03-31'));
        });
      });

      context('when user pays more than initial payment', () => {
        beforeEach(async () => {
          await Transaction.create({ ...transaction, amount: 2_500_000 });
          await generateNextPaymentDate({ offerId: offer._id });
        });

        it('returns minus 500 thousand as expected balance', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments.length).to.eql(1);
          expect(matchedNextPayments[0].resolved).to.eql(false);
          expect(matchedNextPayments[0].expectedAmount).to.eql(-500_000);
          expect(matchedNextPayments[0].expiresOn).to.eql(new Date('2020-03-31'));
        });
      });

      context('when user pays exact amount', () => {
        beforeEach(async () => {
          await Transaction.create({ ...transaction, amount: 2_000_000 });
          await generateNextPaymentDate({ offerId: offer._id });
        });

        it('returns zero as expected balance', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments.length).to.eql(1);
          expect(matchedNextPayments[0].resolved).to.eql(false);
          expect(matchedNextPayments[0].expectedAmount).to.eql(0);
          expect(matchedNextPayments[0].expiresOn).to.eql(new Date('2020-03-31'));
        });
      });

      context('when a user makes multiple payment', () => {
        beforeEach(async () => {
          await Transaction.create(transaction);
          await generateNextPaymentDate({ offerId: offer._id });
        });

        it('returns minus 1 million for first payment', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments.length).to.eql(1);
          expect(matchedNextPayments[0].resolved).to.eql(false);
          expect(matchedNextPayments[0].expectedAmount).to.eql(1_000_000);
          expect(matchedNextPayments[0].expiresOn).to.eql(new Date('2020-03-31'));
        });

        context('after first payment is made', () => {
          beforeEach(async () => {
            await Transaction.create({
              ...transaction,
              amount: 750_000,
              _id: mongoose.Types.ObjectId(),
            });
            await generateNextPaymentDate({ offerId: offer._id });
          });

          it('returns minus 250 thousand', async () => {
            const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
            expect(matchedNextPayments.length).to.eql(2);
            expect(matchedNextPayments[0].resolved).to.eql(true);
            expect(matchedNextPayments[0].resolvedViaTransaction).to.eql(false);
            expect(matchedNextPayments[1].resolved).to.eql(false);
            expect(matchedNextPayments[1].expectedAmount).to.eql(250_000);
            expect(matchedNextPayments[1].expiresOn).to.eql(new Date('2020-03-31'));
          });
        });
      });

      context('when user completes his total payment here', () => {
        beforeEach(async () => {
          await Transaction.create({ ...transaction, amount: 4_000_000 });
          await generateNextPaymentDate({ offerId: offer._id });
        });

        it('returns no next payment', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments.length).to.eql(0);
        });
      });
    });

    describe('Payment schedule is in the second cycle', () => {
      beforeEach(async () => {
        fakeDate = sinon.useFakeTimers({
          now: new Date('2020-04-05'),
        });
      });

      context('when a previous nextPayment record exists (user has not made payment)', () => {
        beforeEach(async () => {
          await NextPayment.create(nextPayment);
          await generateNextPaymentDate({ offerId: offer._id });
        });

        it('returns 2.5 million as expected balance', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments.length).to.eql(2);
          expect(matchedNextPayments[0]._id).to.eql(nextPayment._id);
          expect(matchedNextPayments[0].resolved).to.eql(true);
          expect(matchedNextPayments[0].resolvedViaTransaction).to.eql(false);
          expect(matchedNextPayments[1].resolved).to.eql(false);
          expect(matchedNextPayments[1].expectedAmount).to.eql(2_500_000);
          expect(matchedNextPayments[1].expiresOn).to.eql(new Date('2020-04-30'));
        });
      });

      context(
        'when a previous nextPayment record does not exist (user has not made payment)',
        () => {
          beforeEach(async () => {
            await generateNextPaymentDate({ offerId: offer._id });
          });

          it('returns 2.5 million as expected balance', async () => {
            const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
            expect(matchedNextPayments[0].resolved).to.eql(false);
            expect(matchedNextPayments[0].expectedAmount).to.eql(2_500_000);
            expect(matchedNextPayments[0].expiresOn).to.eql(new Date('2020-04-30'));
          });
        },
      );

      context('when a previous nextPayment record exists (user has made payment)', () => {
        beforeEach(async () => {
          await NextPayment.create(nextPayment);
          await Transaction.create({ ...transaction, amount: 2_000_000 });
          await generateNextPaymentDate({ offerId: offer._id });
        });

        it('returns 500 thousand as expected balance', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments.length).to.eql(2);
          expect(matchedNextPayments[0]._id).to.eql(nextPayment._id);
          expect(matchedNextPayments[0].resolved).to.eql(true);
          expect(matchedNextPayments[0].resolvedViaTransaction).to.eql(false);
          expect(matchedNextPayments[1].resolved).to.eql(false);
          expect(matchedNextPayments[1].expectedAmount).to.eql(500_000);
          expect(matchedNextPayments[1].expiresOn).to.eql(new Date('2020-04-30'));
        });
      });

      context('when a previous nextPayment record does not exist (user has made payment)', () => {
        beforeEach(async () => {
          await Transaction.create({
            ...transaction,
            amount: 2_000_000,
            _id: mongoose.Types.ObjectId(),
          });
          await generateNextPaymentDate({ offerId: offer._id });
        });

        it('returns 500 thousand as expected balance', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments.length).to.eql(1);
          expect(matchedNextPayments[0].resolved).to.eql(false);
          expect(matchedNextPayments[0].expectedAmount).to.eql(500_000);
          expect(matchedNextPayments[0].expiresOn).to.eql(new Date('2020-04-30'));
        });
      });

      context('when user pays exact amount', () => {
        beforeEach(async () => {
          await Transaction.create({ ...transaction, amount: 2_000_000 });
          await Transaction.create({
            ...transaction,
            amount: 500_000,
            _id: mongoose.Types.ObjectId(),
          });
          await generateNextPaymentDate({ offerId: offer._id });
        });

        it('returns zero as expected balance', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments.length).to.eql(1);
          expect(matchedNextPayments[0].resolved).to.eql(false);
          expect(matchedNextPayments[0].expectedAmount).to.eql(0);
          expect(matchedNextPayments[0].expiresOn).to.eql(new Date('2020-04-30'));
        });
      });

      context('when user underpays for the month', () => {
        beforeEach(async () => {
          await Transaction.create({ ...transaction, amount: 2_000_000 });
          await Transaction.create({
            ...transaction,
            amount: 100_000,
            _id: mongoose.Types.ObjectId(),
          });
          await generateNextPaymentDate({ offerId: offer._id });
        });

        it('returns 400 thousand as expected balance', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments.length).to.eql(1);
          expect(matchedNextPayments[0].resolved).to.eql(false);
          expect(matchedNextPayments[0].expectedAmount).to.eql(400_000);
          expect(matchedNextPayments[0].expiresOn).to.eql(new Date('2020-04-30'));
        });
      });

      context('when user overpays for the month', () => {
        beforeEach(async () => {
          await Transaction.create({ ...transaction, amount: 2_000_000 });
          await Transaction.create({
            ...transaction,
            amount: 700_000,
            _id: mongoose.Types.ObjectId(),
          });
          await generateNextPaymentDate({ offerId: offer._id });
        });

        it('returns minus 200 thousand as expected balance', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments.length).to.eql(1);
          expect(matchedNextPayments[0].resolved).to.eql(false);
          expect(matchedNextPayments[0].expectedAmount).to.eql(-200_000);
          expect(matchedNextPayments[0].expiresOn).to.eql(new Date('2020-04-30'));
        });
      });

      context('when user completes total payment here', () => {
        beforeEach(async () => {
          await Transaction.create({ ...transaction, amount: 2_000_000 });
          await Transaction.create({
            ...transaction,
            amount: 2_000_000,
            _id: mongoose.Types.ObjectId(),
          });
          await generateNextPaymentDate({ offerId: offer._id });
        });

        it('returns no next payment', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments.length).to.eql(0);
        });
      });
    });

    describe('Payment schedule is in the last cycle', () => {
      beforeEach(async () => {
        fakeDate = sinon.useFakeTimers({
          now: new Date('2020-06-15'),
        });
      });

      context(
        'when user has made some previous payments in transaction for previous cycles',
        () => {
          beforeEach(async () => {
            await Transaction.create({ ...transaction, amount: 3_500_000 });
            await generateNextPaymentDate({ offerId: offer._id });
          });

          it('returns 500 thousand as expected balance', async () => {
            const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
            expect(matchedNextPayments.length).to.eql(1);
            expect(matchedNextPayments[0].resolved).to.eql(false);
            expect(matchedNextPayments[0].expectedAmount).to.eql(500_000);
            expect(matchedNextPayments[0].expiresOn).to.eql(new Date('2020-06-29'));
          });
        },
      );

      context('when user pays exact remaining amount for the whole property', () => {
        beforeEach(async () => {
          await Transaction.create({ ...transaction, amount: 4_000_000 });
          await generateNextPaymentDate({ offerId: offer._id });
        });

        it('returns no next payment', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments.length).to.eql(0);
        });
      });

      context('when user underpays for the whole property', () => {
        beforeEach(async () => {
          await Transaction.create({ ...transaction, amount: 3_000_000 });
          await generateNextPaymentDate({ offerId: offer._id });
        });

        it('returns 1 million as expected balance', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments.length).to.eql(1);
          expect(matchedNextPayments[0].resolved).to.eql(false);
          expect(matchedNextPayments[0].expectedAmount).to.eql(1_000_000);
          expect(matchedNextPayments[0].expiresOn).to.eql(new Date('2020-06-29'));
        });
      });

      context('when a user overpays for the whole property', () => {
        beforeEach(async () => {
          await Transaction.create({ ...transaction, amount: 6_000_000 });
          await generateNextPaymentDate({ offerId: offer._id });
        });

        it('returns no next payment', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments.length).to.eql(0);
        });
      });
    });

    describe('Payment schedule is past the last cycle', () => {
      beforeEach(async () => {
        fakeDate = sinon.useFakeTimers({
          now: new Date('2020-07-12'),
        });
      });

      context('the user has outstanding payments', () => {
        beforeEach(async () => {
          await Transaction.create({ ...transaction, amount: 2_500_000 });
          await generateNextPaymentDate({ offerId: offer._id });
        });

        it('returns next payment', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments.length).to.eql(1);
          expect(matchedNextPayments[0].resolved).to.eql(false);
          expect(matchedNextPayments[0].expectedAmount).to.eql(1_500_000);
          expect(matchedNextPayments[0].expiresOn).to.eql(new Date('2020-06-29'));
        });
      });
    });
  });
});
