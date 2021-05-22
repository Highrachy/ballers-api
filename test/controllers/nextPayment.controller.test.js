import mongoose from 'mongoose';
import { expect, request, sinon } from '../config';
import NextPayment from '../../server/models/nextPayment.model';
import NextPaymentFactory from '../factories/nextPayment.factory';
import UserFactory from '../factories/user.factory';
import PropertyFactory from '../factories/property.factory';
import { addUser } from '../../server/services/user.service';
import { addProperty } from '../../server/services/property.service';
import { USER_ROLE } from '../../server/helpers/constants';
import {
  itReturnsTheRightPaginationValue,
  itReturnsForbiddenForNoToken,
  itReturnsAnErrorWhenServiceFails,
  itReturnsEmptyValuesWhenNoItemExistInDatabase,
  futureDate,
} from '../helpers';
import * as MailService from '../../server/services/mailer.service';
import EMAIL_CONTENT from '../../mailer';
import Offer from '../../server/models/offer.model';
import OfferFactory from '../factories/offer.factory';
import TransactionFactory from '../factories/transaction.factory';
import { addTransaction } from '../../server/services/transaction.service';

let userToken;
let adminToken;
let vendorToken;
const adminUser = UserFactory.build(
  {
    role: USER_ROLE.ADMIN,
    activated: true,
  },
  { generateId: true },
);
const regularUser = UserFactory.build(
  { role: USER_ROLE.USER, activated: true },
  { generateId: true },
);
const vendorUser = UserFactory.build(
  {
    role: USER_ROLE.VENDOR,
    activated: true,
    vendor: { verified: true },
  },
  { generateId: true },
);

const vendorProperty = PropertyFactory.build({ addedBy: vendorUser._id }, { generateId: true });

let sendMailStub;
const sandbox = sinon.createSandbox();

describe('Next Payments Controller', () => {
  beforeEach(() => {
    sendMailStub = sandbox.stub(MailService, 'sendMail');
  });

  afterEach(() => {
    sandbox.restore();
  });

  beforeEach(async () => {
    userToken = await addUser(regularUser);
    adminToken = await addUser(adminUser);
    vendorToken = await addUser(vendorUser);
    await addProperty(vendorProperty);
  });

  describe('Get All Next Payments', () => {
    const endpoint = '/api/v1/next-payment/all';
    const method = 'get';

    const vendorUser2 = UserFactory.build(
      {
        role: USER_ROLE.VENDOR,
        activated: true,
        vendor: { verified: true },
      },
      { generateId: true },
    );

    const vendor2Property = PropertyFactory.build(
      { addedBy: vendorUser2._id },
      { generateId: true },
    );

    const unresolvedNextPayments1 = NextPaymentFactory.buildList(8, {
      propertyId: vendorProperty._id,
      userId: regularUser._id,
      vendorId: vendorUser._id,
      resolved: false,
    });
    const unresolvedNextPayments2 = NextPaymentFactory.buildList(10, {
      propertyId: vendor2Property._id,
      userId: regularUser._id,
      vendorId: vendorUser2._id,
      resolved: false,
    });
    const resolvedNextPayments = NextPaymentFactory.buildList(3, {
      propertyId: vendorProperty._id,
      userId: regularUser._id,
      vendorId: vendorUser._id,
      resolved: true,
    });

    beforeEach(async () => {
      await addUser(vendorUser2);
      await addProperty(vendor2Property);
    });

    describe('Next Payments Pagination', () => {
      context('when db is empty', () => {
        [regularUser, vendorUser, adminUser].map((user) =>
          itReturnsEmptyValuesWhenNoItemExistInDatabase({
            endpoint,
            method,
            user,
            useExistingUser: true,
          }),
        );
      });

      describe('when next payments exist in db', () => {
        beforeEach(async () => {
          await NextPayment.insertMany([
            ...unresolvedNextPayments1,
            ...unresolvedNextPayments2,
            ...resolvedNextPayments,
          ]);
        });

        [regularUser, adminUser].map((user) =>
          itReturnsTheRightPaginationValue({
            endpoint,
            method,
            user,
            useExistingUser: true,
          }),
        );

        context('when request is sent by vendor token', () => {
          it('returns vendor next payments', (done) => {
            request()
              [method](endpoint)
              .set('authorization', vendorToken)
              .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.success).to.be.eql(true);
                expect(res.body.pagination.currentPage).to.be.eql(1);
                expect(res.body.pagination.limit).to.be.eql(10);
                expect(res.body.pagination.total).to.be.eql(8);
                expect(res.body.pagination.offset).to.be.eql(0);
                expect(res.body.result.length).to.be.eql(8);
                expect(res.body.result[0].propertyId).to.be.eql(vendorProperty._id.toString());
                expect(res.body.result[0].vendorId).to.be.eql(vendorUser._id.toString());
                expect(res.body.result[0].propertyInfo._id).to.be.eql(
                  vendorProperty._id.toString(),
                );
                expect(res.body.result[0].userInfo._id).to.be.eql(regularUser._id.toString());
                expect(res.body.result[0].resolved).to.be.eql(false);
                done();
              });
          });
        });

        context('when request is sent by admin token', () => {
          it('returns all next payments', (done) => {
            request()
              [method](endpoint)
              .set('authorization', adminToken)
              .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.success).to.be.eql(true);
                expect(res.body.result[0].propertyId).to.be.eql(vendorProperty._id.toString());
                expect(res.body.result[0].vendorId).to.be.eql(vendorUser._id.toString());
                expect(res.body.result[0].propertyInfo._id).to.be.eql(
                  vendorProperty._id.toString(),
                );
                expect(res.body.result[0].userInfo._id).to.be.eql(regularUser._id.toString());
                expect(res.body.result[0].vendorInfo._id).to.be.eql(vendorUser._id.toString());
                expect(res.body.result[0].resolved).to.be.eql(false);
                done();
              });
          });
        });

        context('when request is sent by user token', () => {
          it('returns user next payments', (done) => {
            request()
              [method](endpoint)
              .set('authorization', userToken)
              .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.success).to.be.eql(true);
                expect(res.body.result[0].propertyId).to.be.eql(vendorProperty._id.toString());
                expect(res.body.result[0].vendorId).to.be.eql(vendorUser._id.toString());
                expect(res.body.result[0].propertyInfo._id).to.be.eql(
                  vendorProperty._id.toString(),
                );
                expect(res.body.result[0].vendorInfo._id).to.be.eql(vendorUser._id.toString());
                expect(res.body.result[0].resolved).to.be.eql(false);
                done();
              });
          });
        });

        itReturnsForbiddenForNoToken({ endpoint, method });

        itReturnsAnErrorWhenServiceFails({
          endpoint,
          method,
          user: regularUser,
          model: NextPayment,
          modelMethod: 'aggregate',
          useExistingUser: true,
        });
      });
    });
  });

  describe('Send Reminders', () => {
    let fakeDate;
    const endpoint = '/api/v1/next-payment/reminder';
    const method = 'get';

    const unresolvedNextPayments = NextPaymentFactory.buildList(2, {
      propertyId: vendorProperty._id,
      userId: regularUser._id,
      vendorId: vendorUser._id,
      resolved: false,
      expiresOn: futureDate,
    });

    const resolvedNextPayments = NextPaymentFactory.buildList(3, {
      propertyId: vendorProperty._id,
      userId: regularUser._id,
      vendorId: vendorUser._id,
      resolved: true,
      expiresOn: futureDate,
    });

    const oneDayAway = NextPaymentFactory.build({
      propertyId: vendorProperty._id,
      userId: regularUser._id,
      vendorId: vendorUser._id,
      resolved: false,
      expiresOn: new Date('2020-03-25'),
    });

    const sevenDaysAway = NextPaymentFactory.build({
      propertyId: vendorProperty._id,
      userId: regularUser._id,
      vendorId: vendorUser._id,
      resolved: false,
      expiresOn: new Date('2020-03-31'),
    });

    const thirtyDaysAway = NextPaymentFactory.build({
      propertyId: vendorProperty._id,
      userId: regularUser._id,
      vendorId: vendorUser._id,
      resolved: false,
      expiresOn: new Date('2020-04-23'),
    });

    afterEach(() => {
      fakeDate.restore();
    });

    beforeEach(async () => {
      await NextPayment.insertMany([
        ...unresolvedNextPayments,
        ...resolvedNextPayments,
        oneDayAway,
        sevenDaysAway,
        thirtyDaysAway,
      ]);
    });

    context('when date is in range of 3 next payments', () => {
      beforeEach(async () => {
        fakeDate = sinon.useFakeTimers({
          now: new Date('2020-03-24'),
        });
      });

      it('sends 3 reminders', (done) => {
        request()
          [method](endpoint)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('3 reminders sent');
            expect(sendMailStub.callCount).to.eq(3);
            expect(sendMailStub).to.have.be.calledWith(EMAIL_CONTENT.PAYMENT_REMINDER);
            done();
          });
      });
    });

    context('when date is 7 days away from 1 next payment', () => {
      beforeEach(async () => {
        fakeDate = sinon.useFakeTimers({
          now: new Date('2020-04-16'),
        });
      });

      it('sends 1 reminder', (done) => {
        request()
          [method](endpoint)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('1 reminder sent');
            expect(sendMailStub.callCount).to.eq(1);
            expect(sendMailStub).to.have.be.calledWith(EMAIL_CONTENT.PAYMENT_REMINDER);
            done();
          });
      });
    });

    context('when date is 1 day away from 1 next payment', () => {
      beforeEach(async () => {
        fakeDate = sinon.useFakeTimers({
          now: new Date('2020-04-22'),
        });
      });

      it('sends 1 reminder', (done) => {
        request()
          [method](endpoint)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('1 reminder sent');
            expect(sendMailStub.callCount).to.eq(1);
            expect(sendMailStub).to.have.be.calledWith(EMAIL_CONTENT.PAYMENT_REMINDER);
            done();
          });
      });
    });

    context('when date is not in range of any next payment', () => {
      beforeEach(async () => {
        fakeDate = sinon.useFakeTimers({
          now: new Date('2020-03-16'),
        });
      });

      it('sends no reminder', (done) => {
        request()
          [method](endpoint)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('0 reminders sent');
            expect(sendMailStub.callCount).to.eq(0);
            done();
          });
      });
    });

    itReturnsAnErrorWhenServiceFails({
      endpoint,
      method,
      user: regularUser,
      model: NextPayment,
      modelMethod: 'aggregate',
      useExistingUser: true,
    });
  });

  describe('Recalculate Next Payment', () => {
    let fakeDate;

    afterEach(() => {
      fakeDate.restore();
    });

    const offer = OfferFactory.build(
      {
        enquiryId: mongoose.Types.ObjectId(),
        propertyId: vendorProperty._id,
        vendorId: vendorUser._id,
        userId: regularUser._id,
        totalAmountPayable: 100_000,
        initialPayment: 50_000,
        periodicPayment: 10_000,
        paymentFrequency: 30,
        initialPaymentDate: new Date('2020-03-01'),
        referenceCode: '123456XXX',
      },
      { generateId: true },
    );

    const transaction = TransactionFactory.build({
      propertyId: vendorProperty._id,
      offerId: offer._id,
      userId: regularUser._id,
      addedBy: adminUser._id,
      updatedBy: adminUser._id,
      amount: 60_000,
    });

    const endpoint = `/api/v1/next-payment/recalculate/${offer._id}`;
    const method = 'get';

    beforeEach(async () => {
      fakeDate = sinon.useFakeTimers({
        now: new Date('2020-03-24'),
      });

      await Offer.create(offer);
    });

    context('with a valid token & id', () => {
      beforeEach(async () => {
        await addTransaction(transaction);
      });

      context('when offer payment is still on', () => {
        it('successfully recalculates next payment', (done) => {
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Next payment recalculated');
              expect(res.body.nextPayment.expectedAmount).to.be.eql(10_000);
              expect(res.body.nextPayment.offerId).to.be.eql(offer._id.toString());
              expect(res.body.nextPayment.expiresOn).to.have.string('2020-04-30');
              done();
            });
        });
      });

      context('when offer payment is complete', () => {
        beforeEach(async () => {
          await addTransaction(transaction);
        });

        it('returns offer complete', (done) => {
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Offer has been completed');
              done();
            });
        });
      });
    });

    context('when offer id is invalid', () => {
      it('returns error', (done) => {
        request()
          [method](`/api/v1/next-payment/recalculate/${mongoose.Types.ObjectId()}`)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Invalid offer');
            done();
          });
      });
    });

    context('with a valid token without access permission', () => {
      [...new Array(2)].map((_, index) =>
        it('returns forbidden', (done) => {
          request()
            [method](endpoint)
            .set('authorization', [userToken, vendorToken][index])
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('You are not permitted to perform this action');
              done();
            });
        }),
      );
    });

    itReturnsForbiddenForNoToken({ endpoint, method });
  });

  describe('Resolve Expired Pending Next Payments', () => {
    let fakeDate;
    const endpoint = '/api/v1/next-payment/resolve-expired';
    const method = 'get';

    afterEach(() => {
      fakeDate.restore();
    });

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
          expiresOn: new Date('2020-03-01'),
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
        now: new Date('2020-03-24'),
      });
    });

    context('only multiple next payments are processed', () => {
      beforeEach(async () => {
        await Offer.insertMany([...unresolvedNextPaymentsOffers, ...resolvedNextPaymentsOffers]);
        await NextPayment.insertMany([...unresolvedNextPayments, ...resolvedNextPayments]);
      });

      context('when next payments are processed properly', () => {
        it('successfully processes next payments', (done) => {
          request()
            [method](endpoint)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('100 next payments processed');
              done();
            });
        });
      });
    });

    context('only 1 next payment is processed', () => {
      beforeEach(async () => {
        await Offer.insertMany([unresolvedNextPaymentsOffers[0], ...resolvedNextPaymentsOffers]);
        await NextPayment.insertMany([unresolvedNextPayments[0], ...resolvedNextPayments]);
      });

      context('when next payment is processed properly', () => {
        it('successfully processes next payment', (done) => {
          request()
            [method](endpoint)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('1 next payment processed');
              done();
            });
        });
      });
    });

    context('only no next payment is processed', () => {
      context('when next payments are processed properly', () => {
        it('successfully processes next payments', (done) => {
          request()
            [method](endpoint)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('0 next payments processed');
              done();
            });
        });
      });
    });
  });
});
