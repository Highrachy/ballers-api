import mongoose from 'mongoose';
import { expect, sinon } from '../config';
import NextPayment from '../../server/models/nextPayment.model';
import Offer from '../../server/models/offer.model';
import Transaction from '../../server/models/transaction.model';
import {
  generateNextPaymentDate,
  resolveExpiredNextPayments,
  sendReminder,
} from '../../server/services/nextPayment.service';
import OfferFactory from '../factories/offer.factory';
import NextPaymentFactory from '../factories/nextPayment.factory';
import TransactionFactory from '../factories/transaction.factory';
import { OFFER_STATUS, USER_ROLE } from '../../server/helpers/constants';
import Notification from '../../server/models/notification.model';
import UserFactory from '../factories/user.factory';
import PropertyFactory from '../factories/property.factory';
import { addUser } from '../../server/services/user.service';
import { addProperty } from '../../server/services/property.service';
import { futureDate } from '../helpers';
import { getEndOfDay } from '../../server/helpers/dates';

describe('NextPayment Service', () => {
  describe('#generateNextPaymentDate', () => {
    let fakeDate;
    const expiresOnForFirstCycle = getEndOfDay('2020-03-01');
    const expiresOnForSecondCycle = getEndOfDay('2020-03-31');
    const expiresOnForThirdCycle = getEndOfDay('2020-04-30');
    const expiresOnforFourthCycle = getEndOfDay('2020-05-30');
    const expiresOnForLastCycle = getEndOfDay('2020-06-29');

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

    beforeEach(async () => {
      await Offer.create(offer);
    });

    afterEach(() => {
      fakeDate.restore();
    });

    describe('Payment schedule is in the first cycle', () => {
      beforeEach(async () => {
        fakeDate = sinon.useFakeTimers({
          now: new Date('2020-02-21'),
        });
      });

      context('when a previous nextPayment record exists', () => {
        beforeEach(async () => {
          await NextPayment.create(nextPayment);
          await generateNextPaymentDate({ offerId: offer._id });
        });

        it('returns the expected balance', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments.length).to.eql(2);
          expect(matchedNextPayments[0]._id).to.eql(nextPayment._id);
          expect(matchedNextPayments[0].resolved).to.eql(true);
          expect(matchedNextPayments[0].resolvedViaTransaction).to.eql(false);

          expect(matchedNextPayments[1].resolved).to.eql(false);
          expect(matchedNextPayments[1].expectedAmount).to.eql(2_000_000);
          expect(matchedNextPayments[1].expiresOn).to.eql(expiresOnForFirstCycle);
        });
      });

      context('when a previous nextPayment record does not exist', () => {
        beforeEach(async () => {
          await generateNextPaymentDate({ offerId: offer._id });
        });

        it('returns the expected balance', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments.length).to.eql(1);
          expect(matchedNextPayments[0].resolved).to.eql(false);
          expect(matchedNextPayments[0].expectedAmount).to.eql(2_000_000);
          expect(matchedNextPayments[0].expiresOn).to.eql(expiresOnForFirstCycle);
        });
      });

      context('when a user pays less than initial payment', () => {
        beforeEach(async () => {
          await Transaction.create(transaction);
          await generateNextPaymentDate({ offerId: offer._id });
        });

        it('returns the expected balance', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments.length).to.eql(1);
          expect(matchedNextPayments[0].resolved).to.eql(false);
          expect(matchedNextPayments[0].expectedAmount).to.eql(1_000_000);
          expect(matchedNextPayments[0].expiresOn).to.eql(expiresOnForFirstCycle);
        });
      });

      context('when user pays for first and second cycle', () => {
        beforeEach(async () => {
          await Transaction.create({ ...transaction, amount: 2_500_000 });
          await generateNextPaymentDate({ offerId: offer._id });
        });

        it('returns the expected balance for third cycle', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments.length).to.eql(1);
          expect(matchedNextPayments[0].resolved).to.eql(false);
          expect(matchedNextPayments[0].expectedAmount).to.eql(500_000);
          expect(matchedNextPayments[0].expiresOn).to.eql(expiresOnForThirdCycle);
        });
      });

      context('when user pays more than initial payment', () => {
        beforeEach(async () => {
          await Transaction.create({ ...transaction, amount: 2_150_000 });
          await generateNextPaymentDate({ offerId: offer._id });
        });

        it('returns the expected balance for second cycle', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments.length).to.eql(1);
          expect(matchedNextPayments[0].resolved).to.eql(false);
          expect(matchedNextPayments[0].expectedAmount).to.eql(350_000);
          expect(matchedNextPayments[0].expiresOn).to.eql(expiresOnForSecondCycle);
        });
      });

      context('when user pays exact amount', () => {
        beforeEach(async () => {
          await Transaction.create({ ...transaction, amount: 2_000_000 });
          await generateNextPaymentDate({ offerId: offer._id });
        });

        it('returns expected balance for second cycle', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments.length).to.eql(1);
          expect(matchedNextPayments[0].resolved).to.eql(false);
          expect(matchedNextPayments[0].expectedAmount).to.eql(500_000);
          expect(matchedNextPayments[0].expiresOn).to.eql(expiresOnForSecondCycle);
        });
      });

      context('when a user makes multiple payment', () => {
        beforeEach(async () => {
          await Transaction.create(transaction);
          await generateNextPaymentDate({ offerId: offer._id });
        });

        it('returns the remaining balance', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments.length).to.eql(1);
          expect(matchedNextPayments[0].resolved).to.eql(false);
          expect(matchedNextPayments[0].expectedAmount).to.eql(1_000_000);
          expect(matchedNextPayments[0].expiresOn).to.eql(expiresOnForFirstCycle);
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

          it('returns the remaining balance', async () => {
            const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
            expect(matchedNextPayments.length).to.eql(2);
            expect(matchedNextPayments[0].resolved).to.eql(true);
            expect(matchedNextPayments[0].resolvedViaTransaction).to.eql(false);
            expect(matchedNextPayments[1].resolved).to.eql(false);
            expect(matchedNextPayments[1].expectedAmount).to.eql(250_000);
            expect(matchedNextPayments[1].expiresOn).to.eql(expiresOnForFirstCycle);
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
          const resolvedOffer = await Offer.findById(offer._id);
          expect(resolvedOffer.status).to.eql(OFFER_STATUS.RESOLVED);
        });
      });
    });

    describe('Payment schedule is in the second cycle', () => {
      beforeEach(async () => {
        fakeDate = sinon.useFakeTimers({
          now: new Date('2020-03-08'),
        });
      });

      context('when a previous nextPayment record exists', () => {
        beforeEach(async () => {
          await NextPayment.create(nextPayment);
        });

        context('when user has not made payment', () => {
          beforeEach(async () => {
            await generateNextPaymentDate({ offerId: offer._id });
          });

          it('returns the expected balance', async () => {
            const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
            expect(matchedNextPayments.length).to.eql(2);
            expect(matchedNextPayments[0]._id).to.eql(nextPayment._id);
            expect(matchedNextPayments[0].resolved).to.eql(true);
            expect(matchedNextPayments[0].resolvedViaTransaction).to.eql(false);
            expect(matchedNextPayments[1].resolved).to.eql(false);
            expect(matchedNextPayments[1].expectedAmount).to.eql(2_500_000);
            expect(matchedNextPayments[1].expiresOn).to.eql(expiresOnForFirstCycle);
          });
        });

        context('when user has made payment', () => {
          beforeEach(async () => {
            await Transaction.create({ ...transaction, amount: 2_000_000 });
            await generateNextPaymentDate({ offerId: offer._id });
          });

          it('returns the expected balance', async () => {
            const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
            expect(matchedNextPayments.length).to.eql(2);
            expect(matchedNextPayments[0]._id).to.eql(nextPayment._id);
            expect(matchedNextPayments[0].resolved).to.eql(true);
            expect(matchedNextPayments[0].resolvedViaTransaction).to.eql(false);
            expect(matchedNextPayments[1].resolved).to.eql(false);
            expect(matchedNextPayments[1].expectedAmount).to.eql(500_000);
            expect(matchedNextPayments[1].expiresOn).to.eql(expiresOnForSecondCycle);
          });
        });
      });

      context('when a previous nextPayment record does not exist', () => {
        context('user has not made payment', () => {
          beforeEach(async () => {
            await generateNextPaymentDate({ offerId: offer._id });
          });

          it('returns the expected balance', async () => {
            const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
            expect(matchedNextPayments[0].resolved).to.eql(false);
            expect(matchedNextPayments[0].expectedAmount).to.eql(2_500_000);
            expect(matchedNextPayments[0].expiresOn).to.eql(expiresOnForFirstCycle);
          });
        });

        context('user has made payment', () => {
          beforeEach(async () => {
            await Transaction.create({
              ...transaction,
              amount: 2_000_000,
              _id: mongoose.Types.ObjectId(),
            });
            await generateNextPaymentDate({ offerId: offer._id });
          });

          it('returns the expected balance', async () => {
            const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
            expect(matchedNextPayments.length).to.eql(1);
            expect(matchedNextPayments[0].resolved).to.eql(false);
            expect(matchedNextPayments[0].expectedAmount).to.eql(500_000);
            expect(matchedNextPayments[0].expiresOn).to.eql(expiresOnForSecondCycle);
          });
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

        it('returns expected balance for next cycle', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments.length).to.eql(1);
          expect(matchedNextPayments[0].resolved).to.eql(false);
          expect(matchedNextPayments[0].expectedAmount).to.eql(500_000);
          expect(matchedNextPayments[0].expiresOn).to.eql(expiresOnForThirdCycle);
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

        it('returns the expected balance', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments.length).to.eql(1);
          expect(matchedNextPayments[0].resolved).to.eql(false);
          expect(matchedNextPayments[0].expectedAmount).to.eql(400_000);
          expect(matchedNextPayments[0].expiresOn).to.eql(expiresOnForSecondCycle);
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

        it('returns expected balance for next cycle', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments.length).to.eql(1);
          expect(matchedNextPayments[0].resolved).to.eql(false);
          expect(matchedNextPayments[0].expectedAmount).to.eql(300_000);
          expect(matchedNextPayments[0].expiresOn).to.eql(expiresOnForThirdCycle);
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
          const resolvedOffer = await Offer.findById(offer._id);
          expect(resolvedOffer.status).to.eql(OFFER_STATUS.RESOLVED);
        });
      });
    });

    describe('Payment schedule is in the last cycle', () => {
      beforeEach(async () => {
        fakeDate = sinon.useFakeTimers({
          now: new Date('2020-06-8'),
        });
      });

      context(
        'when user has made some previous payments in transaction for previous cycles',
        () => {
          beforeEach(async () => {
            await Transaction.create({ ...transaction, amount: 3_500_000 });
            await generateNextPaymentDate({ offerId: offer._id });
          });

          it('returns the expected balance', async () => {
            const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
            expect(matchedNextPayments.length).to.eql(1);
            expect(matchedNextPayments[0].resolved).to.eql(false);
            expect(matchedNextPayments[0].expectedAmount).to.eql(500_000);
            expect(matchedNextPayments[0].expiresOn).to.eql(expiresOnForLastCycle);
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
          const resolvedOffer = await Offer.findById(offer._id);
          expect(resolvedOffer.status).to.eql(OFFER_STATUS.RESOLVED);
        });
      });

      context('when user underpays for the whole property', () => {
        beforeEach(async () => {
          await Transaction.create({ ...transaction, amount: 3_000_000 });
          await generateNextPaymentDate({ offerId: offer._id });
        });

        it('returns the expected balance', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments.length).to.eql(1);
          expect(matchedNextPayments[0].resolved).to.eql(false);
          expect(matchedNextPayments[0].expectedAmount).to.eql(1_000_000);
          expect(matchedNextPayments[0].expiresOn).to.eql(expiresOnforFourthCycle);
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
          const resolvedOffer = await Offer.findById(offer._id);
          expect(resolvedOffer.status).to.eql(OFFER_STATUS.RESOLVED);
        });
      });
    });

    describe('Payment schedule is past the last cycle', () => {
      beforeEach(async () => {
        fakeDate = sinon.useFakeTimers({
          now: new Date('2020-07-01'),
        });
      });

      context('the user has outstanding payments', () => {
        beforeEach(async () => {
          await Transaction.create({ ...transaction, amount: 3_500_000 });
          await generateNextPaymentDate({ offerId: offer._id });
        });

        it('returns next payment', async () => {
          const matchedNextPayments = await NextPayment.find({ offerId: offer._id });
          expect(matchedNextPayments.length).to.eql(1);
          expect(matchedNextPayments[0].resolved).to.eql(false);
          expect(matchedNextPayments[0].expectedAmount).to.eql(500_000);
          expect(matchedNextPayments[0].expiresOn).to.eql(expiresOnForLastCycle);
        });
      });
    });
  });

  describe('#resolveExpiredNextPayments', () => {
    let fakeDate;
    let countedNextPayments;
    const expiresOnForFirstCycle = getEndOfDay('2020-03-01');

    const unresolvedNextPaymentsOffers = OfferFactory.buildList(
      100,
      {
        totalAmountPayable: 4_000_000,
        initialPayment: 2_000_000,
        periodicPayment: 500_000,
        paymentFrequency: 30,
        initialPaymentDate: new Date('2020-03-01'),
        referenceCode: 'HIG/P/OLP/02/28022021',
        enquiryId: mongoose.Types.ObjectId(),
        propertyId: mongoose.Types.ObjectId(),
        vendorId: mongoose.Types.ObjectId(),
        userId: mongoose.Types.ObjectId(),
      },
      { generateId: true },
    );

    const unresolvedNextPayments = unresolvedNextPaymentsOffers.map((_, index) =>
      NextPaymentFactory.build(
        {
          offerId: unresolvedNextPaymentsOffers[index]._id,
          propertyId: unresolvedNextPaymentsOffers[index].propertyId,
          userId: unresolvedNextPaymentsOffers[index].userId,
          vendorId: unresolvedNextPaymentsOffers[index].vendorId,
          resolved: false,
          expectedAmount: 2_000_000,
          expiresOn: expiresOnForFirstCycle,
        },
        { generateId: true },
      ),
    );

    const resolvedNextPaymentsOffers = OfferFactory.buildList(
      10,
      {
        totalAmountPayable: 4_000_000,
        initialPayment: 2_000_000,
        periodicPayment: 500_000,
        paymentFrequency: 30,
        initialPaymentDate: new Date('2020-03-01'),
        referenceCode: 'HIG/P/OLP/02/28022021',
        enquiryId: mongoose.Types.ObjectId(),
        propertyId: mongoose.Types.ObjectId(),
        vendorId: mongoose.Types.ObjectId(),
        userId: mongoose.Types.ObjectId(),
      },
      { generateId: true },
    );

    const resolvedNextPayments = resolvedNextPaymentsOffers.map((_, index) =>
      NextPaymentFactory.build(
        {
          offerId: resolvedNextPaymentsOffers[index]._id,
          propertyId: resolvedNextPaymentsOffers[index].propertyId,
          userId: resolvedNextPaymentsOffers[index].userId,
          vendorId: resolvedNextPaymentsOffers[index].vendorId,
          resolved: true,
        },
        { generateId: true },
      ),
    );

    beforeEach(async () => {
      fakeDate = sinon.useFakeTimers({
        now: new Date('2020-03-11'),
      });
      await Offer.insertMany([...unresolvedNextPaymentsOffers, ...resolvedNextPaymentsOffers]);
      await NextPayment.insertMany([...unresolvedNextPayments, ...resolvedNextPayments]);
      countedNextPayments = await NextPayment.countDocuments({});
    });

    afterEach(() => {
      fakeDate.restore();
    });

    context('when expired pending payments are resolved', () => {
      it('returns unresolved & generates new next payments', async () => {
        const processedNextPayments = await resolveExpiredNextPayments();
        expect(processedNextPayments.length).to.eql(unresolvedNextPayments.length);
        expect(processedNextPayments[0].resolved).to.eql(false);
        expect(processedNextPayments[0].expectedAmount).to.eql(2_000_000);
        expect(processedNextPayments[0].expiresOn).to.eql(expiresOnForFirstCycle);

        const currentCountedNextPayments = await NextPayment.countDocuments({});
        expect(currentCountedNextPayments).to.eql(
          countedNextPayments + unresolvedNextPayments.length,
        );

        const generatedNextPayments = await NextPayment.find({
          resolved: false,
        });

        expect(generatedNextPayments.length).to.eql(unresolvedNextPayments.length);
        generatedNextPayments.forEach((payment) => {
          expect(payment.expectedAmount).to.be.eql(2_500_000);
          expect(payment.expiresOn).to.be.eql(expiresOnForFirstCycle);
        });
      });
    });
  });

  describe('#sendReminder', () => {
    let fakeDate;
    let countedNotifications;

    const regularUser = UserFactory.build(
      { role: USER_ROLE.USER, activated: true },
      { generateId: true },
    );

    const vendorProperty = PropertyFactory.build(
      { addedBy: mongoose.Types.ObjectId() },
      { generateId: true },
    );

    const unresolvedNextPayments = NextPaymentFactory.buildList(2, {
      propertyId: vendorProperty._id,
      userId: regularUser._id,
      vendorId: vendorProperty.addedBy,
      resolved: false,
      expiresOn: futureDate,
    });

    const resolvedNextPayments = NextPaymentFactory.buildList(3, {
      propertyId: vendorProperty._id,
      userId: regularUser._id,
      vendorId: vendorProperty.addedBy,
      resolved: true,
      expiresOn: futureDate,
    });

    const oneDayAway = NextPaymentFactory.build({
      propertyId: vendorProperty._id,
      userId: regularUser._id,
      vendorId: vendorProperty.addedBy,
      resolved: false,
      expiresOn: new Date('2020-03-25'),
    });

    const sevenDaysAway = NextPaymentFactory.build({
      propertyId: vendorProperty._id,
      userId: regularUser._id,
      vendorId: vendorProperty.addedBy,
      resolved: false,
      expiresOn: new Date('2020-03-31'),
    });

    const thirtyDaysAway = NextPaymentFactory.build({
      propertyId: vendorProperty._id,
      userId: regularUser._id,
      vendorId: vendorProperty.addedBy,
      resolved: false,
      expiresOn: new Date('2020-04-23'),
    });

    const allNextPayments = [
      ...unresolvedNextPayments,
      ...resolvedNextPayments,
      oneDayAway,
      sevenDaysAway,
      thirtyDaysAway,
    ];

    afterEach(() => {
      fakeDate.restore();
    });

    context('when a valid data is entered', () => {
      beforeEach(async () => {
        fakeDate = sinon.useFakeTimers({
          now: new Date('2020-03-24'),
        });
      });

      beforeEach(async () => {
        await addUser(regularUser);
        await addProperty(vendorProperty);
        await NextPayment.insertMany(allNextPayments);
        countedNotifications = await Notification.countDocuments({});
      });

      context('when new notification is added', () => {
        beforeEach(async () => {
          await sendReminder();
        });

        it('3 notifications are added', async () => {
          const currentCountedNotifications = await Notification.countDocuments({});
          expect(currentCountedNotifications).to.eql(countedNotifications + 3);
        });
      });
    });
  });
});
