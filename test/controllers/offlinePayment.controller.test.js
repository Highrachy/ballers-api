import mongoose from 'mongoose';
import querystring from 'querystring';
import { expect, request, sinon } from '../config';
import OfflinePayment from '../../server/models/offlinePayment.model';
import Offer from '../../server/models/offer.model';
import UserFactory from '../factories/user.factory';
import OfflinePaymentFactory from '../factories/offlinePayment.factory';
import OfferFactory from '../factories/offer.factory';
import AddressFactory from '../factories/address.factory';
import VendorFactory from '../factories/vendor.factory';
import { addOfflinePayment } from '../../server/services/offlinePayment.service';
import { addUser } from '../../server/services/user.service';
import { USER_ROLE, COMMENT_STATUS } from '../../server/helpers/constants';
import {
  itReturnsErrorForEmptyFields,
  itReturnsForbiddenForNoToken,
  itReturnsForbiddenForTokenWithInvalidAccess,
  itReturnsNotFoundForInvalidToken,
  itReturnsEmptyValuesWhenNoItemExistInDatabase,
  itReturnsTheRightPaginationValue,
  itReturnsAnErrorWhenServiceFails,
  expectResponseToExcludeSensitiveUserData,
  expectResponseToContainNecessaryVendorData,
  itReturnAllResultsWhenAnUnknownFilterIsUsed,
  defaultPaginationResult,
  expectsPaginationToReturnTheRightValues,
  itReturnsNoResultWhenNoFilterParameterIsMatched,
  filterTestForSingleParameter,
  futureDate,
} from '../helpers';
import { OFFLINE_PAYMENT_FILTERS } from '../../server/helpers/filters';

let userToken;
let adminToken;

const regularUser = UserFactory.build(
  { role: USER_ROLE.USER, activated: true },
  { generateId: true },
);
const adminUser = UserFactory.build(
  { role: USER_ROLE.ADMIN, activated: true },
  { generateId: true },
);
const vendorUser = UserFactory.build(
  {
    role: USER_ROLE.VENDOR,
    activated: true,
    address: AddressFactory.build(),
    vendor: VendorFactory.build({
      directors: [
        {
          name: 'John Doe',
          isSignatory: true,
          signature: 'signature.jpg',
          phone: '08012345678',
        },
      ],
    }),
  },
  { generateId: true },
);
const offer = OfferFactory.build(
  {
    totalAmountPayable: 4_000_000,
    initialPayment: 2_000_000,
    periodicPayment: 500_000,
    paymentFrequency: 30,
    initialPaymentDate: new Date('2020-03-01'),
    referenceCode: 'HIG/P/OLP/02/28022021',
    propertyId: mongoose.Types.ObjectId(),
    vendorId: vendorUser._id,
    userId: regularUser._id,
  },
  { generateId: true },
);

describe('Offline Payment Controller', () => {
  beforeEach(async () => {
    await addUser(vendorUser);
    userToken = await addUser(regularUser);
    adminToken = await addUser(adminUser);
    await Offer.create(offer);
  });

  describe('Add Offline Payment Route', () => {
    const method = 'post';
    const endpoint = '/api/v1/offline-payment';

    context('when user token is used', () => {
      it('successfully adds payment', (done) => {
        const offlinePayment = OfflinePaymentFactory.build({ offerId: offer._id });
        request()
          .post('/api/v1/offline-payment')
          .set('authorization', userToken)
          .send(offlinePayment)
          .end((err, res) => {
            expect(res).to.have.status(201);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Payment added successfully');
            expect(res.body.payment.userId).to.be.eql(regularUser._id.toString());
            expect(res.body.payment.offerId).to.be.eql(offer._id.toString());
            done();
          });
      });
    });

    context('when non user token is used', () => {
      [adminUser, vendorUser].map((user) =>
        itReturnsForbiddenForTokenWithInvalidAccess({
          endpoint,
          method,
          user,
          useExistingUser: true,
        }),
      );
    });

    itReturnsNotFoundForInvalidToken({
      endpoint,
      method,
      user: regularUser,
      userId: regularUser._id,
      data: OfflinePaymentFactory.build({ offerId: offer._id }),
      useExistingUser: true,
    });

    itReturnsForbiddenForNoToken({ endpoint, method });

    context('with invalid data', () => {
      const invalidEmptyData = {
        amount: '"Amount" must be a number',
        bank: '"Bank" is not allowed to be empty',
        offerId: '"Offer id" is not allowed to be empty',
        dateOfPayment: '"Payment Date" must be a valid date',
        type: '"Payment Type" is not allowed to be empty',
        receipt: '"Receipt" is not allowed to be empty',
      };

      itReturnsErrorForEmptyFields({
        endpoint,
        method,
        user: regularUser,
        data: invalidEmptyData,
        factory: OfflinePaymentFactory,
        useExistingUser: true,
      });
    });

    context('when payment fails to save', () => {
      it('returns the error', (done) => {
        const offlinePayment = OfflinePaymentFactory.build({ offerId: offer._id });
        sinon.stub(OfflinePayment.prototype, 'save').throws(new Error('Type Error'));
        request()
          .post('/api/v1/offline-payment')
          .set('authorization', userToken)
          .send(offlinePayment)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Error adding offline payment');
            done();
            OfflinePayment.prototype.save.restore();
          });
      });
    });
  });

  describe('Update Offline Payment Route', () => {
    const method = 'put';
    const endpoint = '/api/v1/offline-payment';
    const offlinePayment = OfflinePaymentFactory.build(
      {
        offerId: offer._id,
        userId: regularUser._id,
        amount: 10_000,
        bank: 'GTB',
        dateOfPayment: '2020-01-21',
        type: 'bank transfer',
      },
      { generateId: true },
    );

    const updatedData = {
      id: offlinePayment._id,
      amount: 100_000,
      bank: 'Access',
      receipt: 'screenshot.jpg',
    };

    beforeEach(async () => {
      await addOfflinePayment(offlinePayment);
    });

    context('when user token is used', () => {
      it('successfully updates payment', (done) => {
        request()
          .put('/api/v1/offline-payment')
          .set('authorization', userToken)
          .send(updatedData)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Payment updated');
            expect(res.body.payment._id).to.be.eql(offlinePayment._id.toString());
            expect(res.body.payment.userId).to.be.eql(regularUser._id.toString());
            expect(res.body.payment.offerId).to.be.eql(offer._id.toString());
            expect(res.body.payment.amount).to.be.eql(updatedData.amount);
            expect(res.body.payment.bank).to.be.eql(updatedData.bank);
            expect(res.body.payment.receipt).to.be.eql(updatedData.receipt);
            expect(res.body.payment.type).to.be.eql(offlinePayment.type);
            expect(res.body.payment.dateOfPayment).to.have.string(offlinePayment.dateOfPayment);
            done();
          });
      });
    });

    context('when payment is resolved', () => {
      beforeEach(async () => {
        await OfflinePayment.findByIdAndUpdate(offlinePayment._id, { 'resolved.status': true });
      });
      it('returns error', (done) => {
        request()
          .put('/api/v1/offline-payment')
          .set('authorization', userToken)
          .send(updatedData)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Payment has been resolved');
            done();
          });
      });
    });

    context('when non user token is used', () => {
      [adminUser, vendorUser].map((user) =>
        itReturnsForbiddenForTokenWithInvalidAccess({
          endpoint,
          method,
          user,
          useExistingUser: true,
        }),
      );
    });

    itReturnsNotFoundForInvalidToken({
      endpoint,
      method,
      user: regularUser,
      userId: regularUser._id,
      data: OfflinePaymentFactory.build({ offerId: offer._id }),
      useExistingUser: true,
    });

    itReturnsForbiddenForNoToken({ endpoint, method });

    context('when update service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(OfflinePayment, 'findByIdAndUpdate').throws(new Error('Type Error'));
        request()
          .put(endpoint)
          .set('authorization', userToken)
          .send(updatedData)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            OfflinePayment.findByIdAndUpdate.restore();
          });
      });
    });
  });

  describe('Get all offline payments', () => {
    const endpoint = '/api/v1/offline-payment/all';
    const method = 'get';

    const userOfflinePayment = OfflinePaymentFactory.build(
      {
        offerId: offer._id,
        userId: regularUser._id,
        amount: 25_000,
        bank: 'Zenith',
        dateOfPayment: '2020-11-01',
        type: 'cheque',
        resolved: {
          status: true,
          by: mongoose.Types.ObjectId(),
          date: futureDate,
        },
        createdAt: futureDate,
      },
      { generateId: true },
    );

    const userOfflinePayments = OfflinePaymentFactory.buildList(
      9,
      {
        offerId: offer._id,
        userId: regularUser._id,
        amount: 10_000,
        bank: 'GTB',
        dateOfPayment: '2020-01-21',
        type: 'bank transfer',
        resolved: {
          status: false,
        },
      },
      { generateId: true },
    );

    const testUser = UserFactory.build(
      { role: USER_ROLE.USER, activated: true },
      { generateId: true },
    );
    const testUserOffer = OfferFactory.build(
      {
        initialPaymentDate: new Date('2020-03-01'),
        referenceCode: 'HIG/P/OLP/02/28022021',
        propertyId: mongoose.Types.ObjectId(),
        vendorId: vendorUser._id,
        userId: testUser._id,
      },
      { generateId: true },
    );
    const testOfflinePayments = OfflinePaymentFactory.buildList(
      8,
      {
        offerId: testUserOffer._id,
        userId: testUser._id,
        amount: 50_000,
        bank: 'Access',
        dateOfPayment: '2020-01-21',
        type: 'online transfer',
        createdAt: new Date(),
      },
      { generateId: true },
    );

    describe('Pagination Tests', () => {
      context('when no offline payments exists in db', () => {
        [adminUser, regularUser].map((user) =>
          itReturnsEmptyValuesWhenNoItemExistInDatabase({
            endpoint,
            method,
            user,
            useExistingUser: true,
          }),
        );
      });

      describe('when offline payments exist in db', () => {
        beforeEach(async () => {
          await addUser(testUser);
          await Offer.create(testUserOffer);
          await OfflinePayment.insertMany([
            userOfflinePayment,
            ...userOfflinePayments,
            ...testOfflinePayments,
          ]);
        });

        itReturnsTheRightPaginationValue({
          endpoint,
          method,
          user: adminUser,
          useExistingUser: true,
        });

        context('when request is sent by user token', () => {
          it('returns 10 payments', (done) => {
            request()
              [method](endpoint)
              .set('authorization', userToken)
              .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.success).to.be.eql(true);
                expect(res.body.pagination.currentPage).to.be.eql(1);
                expect(res.body.pagination.limit).to.be.eql(10);
                expect(res.body.pagination.total).to.be.eql(10);
                expect(res.body.pagination.offset).to.be.eql(0);
                expect(res.body.result.length).to.be.eql(10);
                expect(res.body.result[0]._id).to.be.eql(userOfflinePayment._id.toString());
                expect(res.body.result[0].userInfo._id).to.be.eql(regularUser._id.toString());
                expect(res.body.result[0].vendorInfo._id).to.be.eql(vendorUser._id.toString());
                expectResponseToExcludeSensitiveUserData(res.body.result[0].userInfo);
                expectResponseToExcludeSensitiveUserData(res.body.result[0].vendorInfo);
                expectResponseToContainNecessaryVendorData(res.body.result[0].vendorInfo);
                done();
              });
          });
        });

        itReturnsForbiddenForTokenWithInvalidAccess({
          endpoint,
          method,
          user: vendorUser,
          useExistingUser: true,
        });

        itReturnsForbiddenForNoToken({ endpoint, method });

        itReturnsAnErrorWhenServiceFails({
          endpoint,
          method,
          user: regularUser,
          model: OfflinePayment,
          modelMethod: 'aggregate',
          useExistingUser: true,
        });
      });
    });

    describe('Filter Tests', () => {
      beforeEach(async () => {
        await addUser(testUser);
        await Offer.create(testUserOffer);
        await OfflinePayment.insertMany([userOfflinePayment, ...testOfflinePayments]);
      });

      describe('Unknown Filters', () => {
        const unknownFilter = {
          dob: '1993-02-01',
        };

        itReturnAllResultsWhenAnUnknownFilterIsUsed({
          filter: unknownFilter,
          method,
          endpoint,
          user: adminUser,
          expectedPagination: {
            ...defaultPaginationResult,
            total: 9,
            result: 9,
            totalPage: 1,
          },
          useExistingUser: true,
        });

        itReturnAllResultsWhenAnUnknownFilterIsUsed({
          filter: unknownFilter,
          method,
          endpoint,
          user: regularUser,
          expectedPagination: {
            ...defaultPaginationResult,
            total: 1,
            result: 1,
            totalPage: 1,
          },
          useExistingUser: true,
        });
      });

      context('when multiple filters are used', () => {
        const multipleFilters = {
          amount: userOfflinePayment.amount,
          bank: userOfflinePayment.bank,
          resolved: userOfflinePayment.resolved.status,
          type: userOfflinePayment.type,
        };
        const filteredParams = querystring.stringify(multipleFilters);

        it('returns matched offline payment', (done) => {
          request()
            [method](`${endpoint}?${filteredParams}`)
            .set('authorization', userToken)
            .end((err, res) => {
              expectsPaginationToReturnTheRightValues(res, {
                currentPage: 1,
                limit: 10,
                offset: 0,
                result: 1,
                total: 1,
                totalPage: 1,
              });
              expect(res.body.result[0]._id).to.be.eql(userOfflinePayment._id.toString());
              expect(res.body.result[0].amount).to.be.eql(multipleFilters.amount);
              expect(res.body.result[0].bank).to.be.eql(multipleFilters.bank);
              expect(res.body.result[0].resolved.status).to.be.eql(multipleFilters.resolved);
              expect(res.body.result[0].type).to.be.eql(multipleFilters.type);
              done();
            });
        });
      });

      context('when no parameter is matched', () => {
        const nonMatchingFilters = {
          amount: 23_000,
          bank: 'Polaris',
          type: 'Direct deposit',
        };

        itReturnsNoResultWhenNoFilterParameterIsMatched({
          filter: nonMatchingFilters,
          method,
          endpoint,
          user: adminUser,
          useExistingUser: true,
        });
      });

      filterTestForSingleParameter({
        filter: OFFLINE_PAYMENT_FILTERS,
        method,
        endpoint,
        user: adminUser,
        dataObject: userOfflinePayment,
        useExistingUser: true,
      });
    });
  });

  describe('Resolve Offline Payment', () => {
    const offlinePayment = OfflinePaymentFactory.build(
      {
        offerId: offer._id,
        userId: regularUser._id,
        amount: 10_000,
        bank: 'GTB',
        dateOfPayment: '2020-01-21',
        type: 'bank transfer',
        resolved: {
          status: false,
        },
      },
      { generateId: true },
    );

    const method = 'put';
    const endpoint = `/api/v1/offline-payment/resolve/${offlinePayment._id}`;

    beforeEach(async () => {
      await addOfflinePayment(offlinePayment);
    });

    context('when offline payment is resolved successfully', () => {
      it('returns resolved offline payment', (done) => {
        request()
          .put(endpoint)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Payment resolved');
            expect(res.body.payment.resolved.status).to.be.eql(true);
            expect(res.body.payment.resolved.by).to.be.eql(adminUser._id.toString());
            done();
          });
      });
    });

    context('when offline payment id is invalid', () => {
      it('returns not found', (done) => {
        request()
          .put(`/api/v1/offline-payment/resolve/${mongoose.Types.ObjectId()}`)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Invalid offline payment');
            done();
          });
      });
    });

    context('when offline payment contains unresolved comment', () => {
      beforeEach(async () => {
        await OfflinePayment.findByIdAndUpdate(offlinePayment._id, {
          comments: [
            {
              status: COMMENT_STATUS.PENDING,
              _id: mongoose.Types.ObjectId(),
              askedBy: regularUser._id,
              question: 'demo question 1',
            },
          ],
        });
      });
      it('returns an error', (done) => {
        request()
          .put(endpoint)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Offline payment still has an unresolved comment');
            done();
          });
      });
    });

    context('when non admin token is used', () => {
      [regularUser, vendorUser].map((user) =>
        itReturnsForbiddenForTokenWithInvalidAccess({
          endpoint,
          method,
          user,
          useExistingUser: true,
        }),
      );
    });

    itReturnsNotFoundForInvalidToken({
      endpoint,
      method,
      user: adminUser,
      userId: adminUser._id,
      data: OfflinePaymentFactory.build({ offerId: offer._id }),
      useExistingUser: true,
    });

    itReturnsForbiddenForNoToken({ endpoint, method });

    context('when resolve service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(OfflinePayment, 'findByIdAndUpdate').throws(new Error('Type Error'));
        request()
          .put(endpoint)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            OfflinePayment.findByIdAndUpdate.restore();
          });
      });
    });
  });

  describe('Raise Comment', () => {
    const offlinePayment = OfflinePaymentFactory.build(
      {
        offerId: offer._id,
        userId: regularUser._id,
        amount: 10_000,
        bank: 'GTB',
        dateOfPayment: '2020-01-21',
        type: 'bank transfer',
        resolved: {
          status: false,
        },
        comments: [
          {
            status: COMMENT_STATUS.PENDING,
            _id: mongoose.Types.ObjectId(),
            askedBy: regularUser._id,
            question: 'demo question 1',
          },
        ],
      },
      { generateId: true },
    );

    const testUser = UserFactory.build(
      { role: USER_ROLE.USER, activated: true },
      { generateId: true },
    );

    const method = 'put';
    const endpoint = '/api/v1/offline-payment/raise-comment';

    const data = {
      paymentId: offlinePayment._id,
      question: 'demo question 2',
    };

    beforeEach(async () => {
      await addOfflinePayment(offlinePayment);
    });

    context('with a valid token is used', () => {
      const ids = [regularUser._id, adminUser._id];
      [...new Array(2)].map((_, index) =>
        it('adds comment', (done) => {
          request()
            [method](endpoint)
            .set('authorization', [userToken, adminToken][index])
            .send(data)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Comment raised');
              expect(res.body.payment.comments.length).to.be.eql(2);
              expect(res.body.payment._id).to.be.eql(offlinePayment._id.toString());
              expect(res.body.payment.comments[1].question).to.be.eql(data.question);
              expect(res.body.payment.comments[1].askedBy).to.be.eql(ids[index].toString());
              done();
            });
        }),
      );
    });

    context('when payment has been resolved', () => {
      beforeEach(async () => {
        await OfflinePayment.findByIdAndUpdate(offlinePayment._id, { 'resolved.status': true });
      });
      it('returns error', (done) => {
        request()
          [method](endpoint)
          .set('authorization', userToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Payment has been resolved');
            done();
          });
      });
    });

    context('when vendor token is used', () => {
      itReturnsForbiddenForTokenWithInvalidAccess({
        endpoint,
        method,
        user: vendorUser,
        data,
        useExistingUser: true,
      });
    });

    context('when user token without access rights is used', () => {
      itReturnsForbiddenForTokenWithInvalidAccess({
        endpoint,
        method,
        data,
        user: testUser,
      });
    });

    itReturnsNotFoundForInvalidToken({
      endpoint,
      method,
      user: regularUser,
      userId: regularUser._id,
      data,
      useExistingUser: true,
    });

    itReturnsForbiddenForNoToken({ endpoint, method, data });

    context('when raise comment service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(OfflinePayment, 'findByIdAndUpdate').throws(new Error('Type Error'));
        request()
          .put(endpoint)
          .set('authorization', userToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            OfflinePayment.findByIdAndUpdate.restore();
          });
      });
    });
  });

  describe('Resolve Comment', () => {
    const offlinePayment = OfflinePaymentFactory.build(
      {
        offerId: offer._id,
        userId: regularUser._id,
        amount: 10_000,
        bank: 'GTB',
        dateOfPayment: '2020-01-21',
        type: 'bank transfer',
        resolved: {
          status: false,
        },
        comments: [
          {
            status: COMMENT_STATUS.RESOLVED,
            _id: mongoose.Types.ObjectId(),
            askedBy: adminUser._id,
            question: 'demo question 1',
          },
          {
            status: COMMENT_STATUS.PENDING,
            _id: mongoose.Types.ObjectId(),
            askedBy: regularUser._id,
            question: 'demo question 2',
          },
        ],
      },
      { generateId: true },
    );

    const testUser = UserFactory.build(
      { role: USER_ROLE.USER, activated: true },
      { generateId: true },
    );

    const method = 'put';
    const endpoint = '/api/v1/offline-payment/resolve-comment';

    const data = {
      paymentId: offlinePayment._id,
      commentId: offlinePayment.comments[1]._id,
      response: 'demo response 2',
    };

    beforeEach(async () => {
      await addOfflinePayment(offlinePayment);
    });

    context('with a valid token is used', () => {
      const ids = [regularUser._id, adminUser._id];
      [...new Array(2)].map((_, index) =>
        it('resolves comment', (done) => {
          request()
            [method](endpoint)
            .set('authorization', [userToken, adminToken][index])
            .send(data)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Comment resolved');
              expect(res.body.payment._id).to.be.eql(offlinePayment._id.toString());
              expect(res.body.payment.comments.length).to.be.eql(2);
              expect(res.body.payment.comments[1]._id).to.be.eql(data.commentId.toString());
              expect(res.body.payment.comments[1].question).to.be.eql(
                offlinePayment.comments[1].question,
              );
              expect(res.body.payment.comments[1].askedBy).to.be.eql(
                offlinePayment.comments[1].askedBy.toString(),
              );
              expect(res.body.payment.comments[1].response).to.be.eql(data.response);
              expect(res.body.payment.comments[1].respondedBy).to.be.eql(ids[index].toString());
              done();
            });
        }),
      );
    });

    context('when payment has been resolved', () => {
      beforeEach(async () => {
        await OfflinePayment.findByIdAndUpdate(offlinePayment._id, { 'resolved.status': true });
      });
      it('returns error', (done) => {
        request()
          [method](endpoint)
          .set('authorization', userToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Payment has been resolved');
            done();
          });
      });
    });

    context('when vendor token is used', () => {
      itReturnsForbiddenForTokenWithInvalidAccess({
        endpoint,
        method,
        user: vendorUser,
        data,
        useExistingUser: true,
      });
    });

    context('when user token without access rights is used', () => {
      itReturnsForbiddenForTokenWithInvalidAccess({
        endpoint,
        method,
        data,
        user: testUser,
      });
    });

    itReturnsNotFoundForInvalidToken({
      endpoint,
      method,
      user: regularUser,
      userId: regularUser._id,
      data,
      useExistingUser: true,
    });

    itReturnsForbiddenForNoToken({ endpoint, method, data });

    context('when resolve comment service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(OfflinePayment, 'findOneAndUpdate').throws(new Error('Type Error'));
        request()
          .put(endpoint)
          .set('authorization', userToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            OfflinePayment.findOneAndUpdate.restore();
          });
      });
    });
  });
});
