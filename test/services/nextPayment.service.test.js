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
      totalAmountPayable: 100000,
      initialPayment: 50000,
      periodicPayment: 10000,
      paymentFrequency: 30,
      initialPaymentDate: new Date('2021-03-01'),
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
      amount: 10000,
    },
    { generateId: true },
  );

  const nextPayment = NextPaymentFactory.build({ offerId: offer._id }, { generateId: true });

  describe('#generateNextPaymentDate', () => {
    let fakeDate;

    afterEach(() => {
      fakeDate.restore();
    });

    context('when nextPayment and transaction exists', () => {
      beforeEach(async () => {
        await Offer.create(offer);
        fakeDate = sinon.useFakeTimers({
          now: new Date('2021-03-20'),
        });
        await NextPayment.create(nextPayment);
        await Transaction.create({ ...transaction, amount: 100000 });
        await generateNextPaymentDate({ offerId: offer._id, transactionId: transaction._id });
      });

      afterEach(() => {
        fakeDate.restore();
      });

      it('adds a new nextPayment', async () => {
        const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
        expect(matchedNextPayments[0].resolved).to.eql(true);
        expect(matchedNextPayments[0].resolvedViaTransaction).to.eql(true);
        expect(matchedNextPayments[0].transactionId).to.eql(transaction._id);
        expect(matchedNextPayments[1].resolved).to.eql(false);
        expect(matchedNextPayments[1].expectedAmount).to.eql(-50000);
        expect(matchedNextPayments[1].expiresOn).to.eql(new Date('2021-03-31'));
      });
    });

    context('where previous nextPayment does not exist', () => {
      context('where previous transaction does not exist', () => {
        beforeEach(async () => {
          await Offer.create(offer);
          fakeDate = sinon.useFakeTimers({
            now: new Date('2021-03-20'),
          });
          await generateNextPaymentDate({ offerId: offer._id });
        });

        afterEach(() => {
          fakeDate.restore();
        });

        it('adds a new nextPayment', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments[matchedNextPayments.length - 1].expectedAmount).to.eql(50000);
          expect(matchedNextPayments[matchedNextPayments.length - 1].resolved).to.eql(false);
          expect(matchedNextPayments[matchedNextPayments.length - 1].expiresOn).to.eql(
            new Date('2021-03-31'),
          );
        });
      });

      context('where previous transaction exists', () => {
        beforeEach(async () => {
          await Offer.create(offer);
          fakeDate = sinon.useFakeTimers({
            now: new Date('2021-04-05'),
          });
          await Transaction.create(transaction);
          await generateNextPaymentDate({ offerId: offer._id });
        });

        afterEach(() => {
          fakeDate.restore();
        });

        it('adds a new nextPayment', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments[matchedNextPayments.length - 1].expectedAmount).to.eql(50000);
          expect(matchedNextPayments[matchedNextPayments.length - 1].resolved).to.eql(false);
          expect(matchedNextPayments[matchedNextPayments.length - 1].expiresOn).to.eql(
            new Date('2021-04-30'),
          );
        });
      });
    });

    context('where previous transaction does not exist', () => {
      beforeEach(async () => {
        await Offer.create(offer);
        fakeDate = sinon.useFakeTimers({
          now: new Date('2021-04-05'),
        });
      });

      afterEach(() => {
        fakeDate.restore();
      });

      context('where previous nextPayment exists', () => {
        beforeEach(async () => {
          await NextPayment.create(nextPayment);
          await generateNextPaymentDate({ offerId: offer._id });
        });

        it('adds a new nextPayment', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments[0].resolvedViaTransaction).to.eql(false);
          expect(matchedNextPayments[0].resolved).to.eql(true);
          expect(matchedNextPayments[1].resolved).to.eql(false);
          expect(matchedNextPayments[1].expectedAmount).to.eql(60000);
          expect(matchedNextPayments[1].expiresOn).to.eql(new Date('2021-04-30'));
        });
      });
    });
  });
});
