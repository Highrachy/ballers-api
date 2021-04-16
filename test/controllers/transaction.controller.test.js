import mongoose from 'mongoose';
import { expect, request, sinon } from '../config';
import Transaction from '../../server/models/transaction.model';
import Offer from '../../server/models/offer.model';
import Referral from '../../server/models/referral.model';
import TransactionFactory from '../factories/transaction.factory';
import OfferFactory from '../factories/offer.factory';
import EnquiryFactory from '../factories/enquiry.factory';
import PropertyFactory from '../factories/property.factory';
import UserFactory from '../factories/user.factory';
import ReferralFactory from '../factories/referral.factory';
import { addUser } from '../../server/services/user.service';
import { addProperty } from '../../server/services/property.service';
import { createOffer } from '../../server/services/offer.service';
import { addEnquiry } from '../../server/services/enquiry.service';
import { addReferral } from '../../server/services/referral.service';
import { OFFER_STATUS, REWARD_STATUS, USER_ROLE } from '../../server/helpers/constants';
import {
  itReturnsForbiddenForNoToken,
  itReturnsForbiddenForTokenWithInvalidAccess,
  itReturnsNotFoundForInvalidToken,
  itReturnsTheRightPaginationValue,
  itReturnsEmptyValuesWhenNoItemExistInDatabase,
  expectsPaginationToReturnTheRightValues,
  itReturnsAnErrorWhenServiceFails,
  defaultPaginationResult,
} from '../helpers';

let adminToken;
let userToken;
let vendorToken;
const adminUser = UserFactory.build(
  { role: USER_ROLE.ADMIN, activated: true },
  { generateId: true },
);
const vendorUser = UserFactory.build(
  {
    role: USER_ROLE.VENDOR,
    activated: true,
    vendor: {
      verified: true,
    },
  },
  { generateId: true },
);
const regularUser = UserFactory.build(
  { role: USER_ROLE.USER, activated: true },
  { generateId: true },
);

const property = PropertyFactory.build(
  { addedBy: vendorUser._id, updatedBy: vendorUser._id },
  { generateId: true },
);

const property1 = PropertyFactory.build(
  { addedBy: vendorUser._id, updatedBy: vendorUser._id },
  { generateId: true },
);
const property2 = PropertyFactory.build(
  { addedBy: vendorUser._id, updatedBy: vendorUser._id },
  { generateId: true },
);
const property3 = PropertyFactory.build(
  { addedBy: vendorUser._id, updatedBy: vendorUser._id },
  { generateId: true },
);
const enquiry = EnquiryFactory.build(
  {
    userId: regularUser._id,
    propertyId: property._id,
  },
  { generateId: true },
);
const offer = OfferFactory.build(
  {
    enquiryId: enquiry._id,
    vendorId: vendorUser._id,
  },
  { generateId: true },
);

describe('Transaction Controller', () => {
  beforeEach(async () => {
    adminToken = await addUser(adminUser);
    userToken = await addUser(regularUser);
    vendorToken = await addUser(vendorUser);
    await addProperty(property);
    await addEnquiry(enquiry);
    await createOffer(offer);
  });

  describe('Get all transactions', () => {
    let vendor2Token;
    const method = 'get';
    const endpoint = '/api/v1/transaction/all';
    const editorUser = UserFactory.build(
      { role: USER_ROLE.EDITOR, activated: true },
      { generateId: true },
    );
    const vendorTransactions = TransactionFactory.buildList(
      10,
      {
        propertyId: property._id,
        offerId: offer._id,
        userId: regularUser._id,
        vendorId: vendorUser._id,
        addedBy: adminUser._id,
        updatedBy: adminUser._id,
        remittance: {
          amount: 100_000,
          by: adminUser._id,
          percentage: 5,
          date: '2020-11-11',
        },
      },
      { generateId: true },
    );
    const testVendor = UserFactory.build(
      {
        role: USER_ROLE.VENDOR,
        activated: true,
        vendor: { verified: true },
      },
      { generateId: true },
    );

    const vendor2 = UserFactory.build(
      {
        role: USER_ROLE.VENDOR,
        activated: true,
        vendor: { verified: true },
      },
      { generateId: true },
    );
    const vendor2Property = PropertyFactory.build(
      { addedBy: vendor2._id, updatedBy: vendor2._id },
      { generateId: true },
    );
    const vendor2Enquiry = EnquiryFactory.build(
      {
        userId: regularUser._id,
        propertyId: vendor2Property._id,
      },
      { generateId: true },
    );
    const vendor2Offer = OfferFactory.build(
      {
        enquiryId: vendor2Enquiry._id,
        vendorId: vendor2._id,
      },
      { generateId: true },
    );
    const vendor2Transactions = TransactionFactory.buildList(
      8,
      {
        propertyId: vendor2Property._id,
        offerId: vendor2Offer._id,
        userId: regularUser._id,
        vendorId: vendor2._id,
        addedBy: adminUser._id,
        updatedBy: adminUser._id,
        remittance: {
          amount: 100_000,
          by: adminUser._id,
          percentage: 5,
          date: '2020-11-11',
        },
      },
      { generateId: true },
    );

    context('when no transaction exists in db', () => {
      [adminUser, vendorUser, regularUser].map((user) =>
        itReturnsEmptyValuesWhenNoItemExistInDatabase({
          endpoint,
          method,
          user,
          useExistingUser: true,
        }),
      );
    });

    describe('when transactions exist in db', () => {
      beforeEach(async () => {
        vendor2Token = await addUser(vendor2);
        await addProperty(vendor2Property);
        await addEnquiry(vendor2Enquiry);
        await createOffer(vendor2Offer);
        await Transaction.insertMany([...vendorTransactions, ...vendor2Transactions]);
      });

      [adminUser, regularUser].map((user) =>
        itReturnsTheRightPaginationValue({
          endpoint,
          method,
          user,
          useExistingUser: true,
        }),
      );

      context('when vendor2Token is used', () => {
        it('returns matched transactons', (done) => {
          request()
            .get('/api/v1/transaction/all')
            .set('authorization', vendor2Token)
            .end((err, res) => {
              expectsPaginationToReturnTheRightValues(res, {
                currentPage: 1,
                limit: 10,
                offset: 0,
                result: 8,
                total: 8,
                totalPage: 1,
              });
              expect(res.body.result[0]._id).to.be.eql(vendor2Transactions[0]._id.toString());
              expect(res.body.result[0].vendorId).to.be.eql(vendor2._id.toString());
              expect(res.body.result[0].propertyId).to.be.eql(
                vendor2Transactions[0].propertyId.toString(),
              );
              expect(res.body.result[0].offerId).to.be.eql(
                vendor2Transactions[0].offerId.toString(),
              );
              expect(res.body.result[0]).to.have.property('remittance');
              done();
            });
        });
      });

      context('when vendorToken is used', () => {
        it('returns matched transactons', (done) => {
          request()
            .get('/api/v1/transaction/all')
            .set('authorization', vendorToken)
            .end((err, res) => {
              expectsPaginationToReturnTheRightValues(res, {
                currentPage: 1,
                limit: 10,
                offset: 0,
                result: 10,
                total: 10,
                totalPage: 1,
              });
              expect(res.body.result[0]._id).to.be.eql(vendorTransactions[0]._id.toString());
              expect(res.body.result[0].vendorId).to.be.eql(vendorUser._id.toString());
              expect(res.body.result[0].propertyId).to.be.eql(
                vendorTransactions[0].propertyId.toString(),
              );
              expect(res.body.result[0].offerId).to.be.eql(
                vendorTransactions[0].offerId.toString(),
              );
              expect(res.body.result[0]).to.have.property('remittance');
              done();
            });
        });
      });

      context('when user token is used', () => {
        it('returns matched transactons', (done) => {
          request()
            .get('/api/v1/transaction/all')
            .set('authorization', userToken)
            .end((err, res) => {
              expectsPaginationToReturnTheRightValues(res, defaultPaginationResult);
              expect(res.body.result[0]).to.not.have.property('remittance');
              done();
            });
        });
      });

      itReturnsForbiddenForTokenWithInvalidAccess({
        endpoint,
        method,
        user: editorUser,
      });

      itReturnsForbiddenForNoToken({ endpoint, method });

      context('when vendor token without access is used', () => {
        itReturnsEmptyValuesWhenNoItemExistInDatabase({
          endpoint,
          method,
          user: testVendor,
        });
      });

      itReturnsNotFoundForInvalidToken({
        endpoint,
        method,
        user: regularUser,
        userId: regularUser._id,
        useExistingUser: true,
      });

      context('when getAllTransactions service fails', () => {
        it('returns the error', (done) => {
          sinon.stub(Transaction, 'aggregate').throws(new Error('Type Error'));
          request()
            .get('/api/v1/transaction/all')
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(500);
              done();
              Transaction.aggregate.restore();
            });
        });
      });
    });
  });

  describe('Get User Transactions By Property route', () => {
    const method = 'get';
    const endpoint = `/api/v1/transaction/property/${property._id}`;

    const editorUser = UserFactory.build(
      { role: USER_ROLE.EDITOR, activated: true },
      { generateId: true },
    );
    const dummyUser = UserFactory.build(
      { role: USER_ROLE.USER, activated: true },
      { generateId: true },
    );
    const userTransactions = TransactionFactory.buildList(
      10,
      {
        propertyId: property._id,
        offerId: offer._id,
        userId: regularUser._id,
        vendorId: vendorUser._id,
        addedBy: adminUser._id,
        updatedBy: adminUser._id,
        remittance: {
          amount: 100_000,
          by: adminUser._id,
          percentage: 5,
          date: '2020-11-11',
        },
      },
      { generateId: true },
    );
    const dummyUserEnquiry = EnquiryFactory.build(
      {
        userId: dummyUser._id,
        propertyId: property._id,
      },
      { generateId: true },
    );
    const dummyUserOffer = OfferFactory.build(
      {
        enquiryId: dummyUserEnquiry._id,
        vendorId: vendorUser._id,
      },
      { generateId: true },
    );
    const dummyUserTransactions = TransactionFactory.buildList(
      8,
      {
        propertyId: property._id,
        offerId: dummyUserOffer._id,
        userId: dummyUser._id,
        vendorId: vendorUser._id,
        addedBy: adminUser._id,
        updatedBy: adminUser._id,
        remittance: {
          amount: 100_000,
          by: adminUser._id,
          percentage: 5,
          date: '2020-11-11',
        },
      },
      { generateId: true },
    );
    const testVendor = UserFactory.build(
      {
        role: USER_ROLE.VENDOR,
        activated: true,
        vendor: { verified: true },
      },
      { generateId: true },
    );

    context('when no transaction exists in db', () => {
      [adminUser, vendorUser, regularUser].map((user) =>
        itReturnsEmptyValuesWhenNoItemExistInDatabase({
          endpoint,
          method,
          user,
          useExistingUser: true,
        }),
      );
    });

    describe('when transactions exist in db', () => {
      beforeEach(async () => {
        await addUser(dummyUser);
        await addEnquiry(dummyUserEnquiry);
        await createOffer(dummyUserOffer);
        await Transaction.insertMany([...userTransactions, ...dummyUserTransactions]);
      });

      [adminUser, vendorUser].map((user) =>
        itReturnsTheRightPaginationValue({
          endpoint,
          method,
          user,
          useExistingUser: true,
        }),
      );

      context('when user is used', () => {
        it('returns matched transactons', (done) => {
          request()
            .get(`/api/v1/transaction/property/${property._id}`)
            .set('authorization', userToken)
            .end((err, res) => {
              expectsPaginationToReturnTheRightValues(res, {
                currentPage: 1,
                limit: 10,
                offset: 0,
                result: 10,
                total: 10,
                totalPage: 1,
              });
              expect(res.body.result[0]._id).to.be.eql(userTransactions[0]._id.toString());
              expect(res.body.result[0].vendorId).to.be.eql(vendorUser._id.toString());
              expect(res.body.result[0].userId).to.be.eql(regularUser._id.toString());
              expect(res.body.result[0].propertyId).to.be.eql(
                userTransactions[0].propertyId.toString(),
              );
              expect(res.body.result[0].offerId).to.be.eql(userTransactions[0].offerId.toString());
              expect(res.body.result[0]).to.not.have.property('remittance');
              done();
            });
        });
      });

      itReturnsForbiddenForTokenWithInvalidAccess({
        endpoint,
        method,
        user: editorUser,
      });

      itReturnsForbiddenForNoToken({ endpoint, method });

      context('when vendor token without access is used', () => {
        itReturnsEmptyValuesWhenNoItemExistInDatabase({
          endpoint,
          method,
          user: testVendor,
        });
      });

      itReturnsNotFoundForInvalidToken({
        endpoint,
        method,
        user: regularUser,
        userId: regularUser._id,
        useExistingUser: true,
      });

      context('with invalid property id ', () => {
        it('returns validation error', (done) => {
          request()
            .get(`/api/v1/transaction/property/${property._id}s`)
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Invalid Id supplied');
              done();
            });
        });
      });

      context('when getAllTransactions service fails', () => {
        it('returns the error', (done) => {
          sinon.stub(Transaction, 'aggregate').throws(new Error('Type Error'));
          request()
            .get(`/api/v1/transaction/property/${property._id}`)
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(500);
              done();
              Transaction.aggregate.restore();
            });
        });
      });
    });
  });

  describe('Get User Contribution Rewards', () => {
    let testUserToken;
    const testUser = UserFactory.build(
      { role: USER_ROLE.USER, activated: true },
      { generateId: true },
    );
    const allocatedEnquiry = EnquiryFactory.build(
      {
        userId: testUser._id,
        propertyId: property1._id,
      },
      { generateId: true },
    );
    const allocatedOffer = OfferFactory.build(
      {
        enquiryId: allocatedEnquiry._id,
        vendorId: adminUser._id,
        status: OFFER_STATUS.ALLOCATED,
        contributionReward: 50000,
      },
      { generateId: true },
    );

    const neglectedEnquiry = EnquiryFactory.build(
      {
        userId: testUser._id,
        propertyId: property2._id,
      },
      { generateId: true },
    );
    const neglectedOffer = OfferFactory.build(
      {
        enquiryId: neglectedEnquiry._id,
        vendorId: adminUser._id,
        status: OFFER_STATUS.NEGLECTED,
      },
      { generateId: true },
    );

    const assignedEnquiry = EnquiryFactory.build(
      {
        userId: testUser._id,
        propertyId: property3._id,
      },
      { generateId: true },
    );
    const assignedOffer = OfferFactory.build(
      {
        enquiryId: assignedEnquiry._id,
        vendorId: adminUser._id,
        status: OFFER_STATUS.ASSIGNED,
        contributionReward: 70000,
      },
      { generateId: true },
    );

    beforeEach(async () => {
      testUserToken = await addUser(testUser);
    });

    context('when no contribution reward is found', () => {
      it('returns empty array of contribution reward', (done) => {
        request()
          .get('/api/v1/transaction/user/contribution-rewards')
          .set('authorization', testUserToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body).to.have.property('contributionRewards');
            expect(res.body.contributionRewards.length).to.be.eql(0);
            done();
          });
      });
    });

    describe('when offers exist in db', () => {
      beforeEach(async () => {
        await addProperty(property1);
        await addProperty(property2);
        await addProperty(property3);
        await addEnquiry(allocatedEnquiry);
        await createOffer(allocatedOffer);
        await addEnquiry(neglectedEnquiry);
        await createOffer(neglectedOffer);
        await addEnquiry(assignedEnquiry);
        await createOffer(assignedOffer);
      });

      context('with valid token', () => {
        it('returns all contribution rewards', (done) => {
          request()
            .get('/api/v1/transaction/user/contribution-rewards')
            .set('authorization', testUserToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('contributionRewards');
              expect(res.body.contributionRewards.length).to.be.eql(2);
              expect(res.body.contributionRewards[0]._id).to.be.eql(allocatedOffer._id.toString());
              expect(res.body.contributionRewards[1]._id).to.be.eql(assignedOffer._id.toString());
              done();
            });
        });
      });

      context('without token', () => {
        it('returns error', (done) => {
          request()
            .get('/api/v1/transaction/user/contribution-rewards')
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Token needed to access resources');
              done();
            });
        });
      });

      context('when getContributionRewards service returns an error', () => {
        it('returns the error', (done) => {
          sinon.stub(Offer, 'aggregate').throws(new Error('Type Error'));
          request()
            .get('/api/v1/transaction/user/contribution-rewards')
            .set('authorization', testUserToken)
            .end((err, res) => {
              expect(res).to.have.status(500);
              done();
              Offer.aggregate.restore();
            });
        });
      });
    });
  });

  describe('Get User Referal Rewards', () => {
    const paidReferral = ReferralFactory.build({
      referrerId: regularUser._id,
      email: 'demo1@mail.com',
      reward: {
        amount: 10000,
        status: REWARD_STATUS.PAID,
      },
    });
    const pendingReferral = ReferralFactory.build({
      referrerId: adminUser._id,
      email: 'demo1@mail.com',
      reward: {
        status: REWARD_STATUS.PENDING,
      },
    });
    const paidReferral2 = ReferralFactory.build({
      referrerId: regularUser._id,
      email: 'demo2@mail.com',
      reward: {
        amount: 20000,
        status: REWARD_STATUS.PAID,
      },
    });

    context('when no referral reward is found', () => {
      it('returns empty array of referral reward', (done) => {
        request()
          .get('/api/v1/transaction/user/referral-rewards')
          .set('authorization', userToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body).to.have.property('referralRewards');
            expect(res.body.referralRewards.length).to.be.eql(0);
            done();
          });
      });
    });

    describe('when offers exist in db', () => {
      beforeEach(async () => {
        await addReferral(paidReferral);
        await addReferral(pendingReferral);
        await addReferral(paidReferral2);
      });

      context('with valid token', () => {
        it('returns all referral rewards', (done) => {
          request()
            .get('/api/v1/transaction/user/referral-rewards')
            .set('authorization', userToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('referralRewards');
              expect(res.body.referralRewards.length).to.be.eql(2);
              expect(res.body.referralRewards[0].referrerId).to.be.eql(regularUser._id.toString());
              expect(res.body.referralRewards[0].reward.status).to.be.eql(
                paidReferral.reward.status,
              );
              expect(res.body.referralRewards[0].reward.amount).to.be.eql(
                paidReferral.reward.amount,
              );
              expect(res.body.referralRewards[1].referrerId).to.be.eql(regularUser._id.toString());
              expect(res.body.referralRewards[1].reward.status).to.be.eql(
                paidReferral2.reward.status,
              );
              expect(res.body.referralRewards[1].reward.amount).to.be.eql(
                paidReferral2.reward.amount,
              );
              done();
            });
        });
      });

      context('without token', () => {
        it('returns error', (done) => {
          request()
            .get('/api/v1/transaction/user/referral-rewards')
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Token needed to access resources');
              done();
            });
        });
      });

      context('when getReferralRewards service returns an error', () => {
        it('returns the error', (done) => {
          sinon.stub(Referral, 'aggregate').throws(new Error('Type Error'));
          request()
            .get('/api/v1/transaction/user/referral-rewards')
            .set('authorization', userToken)
            .end((err, res) => {
              expect(res).to.have.status(500);
              done();
              Referral.aggregate.restore();
            });
        });
      });
    });
  });

  describe('Get Single Transaction', () => {
    let vendor2Token;
    const method = 'get';
    const transaction = TransactionFactory.build(
      {
        userId: regularUser._id,
        propertyId: property._id,
        offerId: offer._id,
        vendorId: vendorUser._id,
        addedBy: adminUser._id,
        updatedBy: adminUser._id,
        remittance: {
          amount: 100_000,
          by: adminUser._id,
          percentage: 5,
          date: '2020-11-11',
        },
      },
      { generateId: true },
    );
    const endpoint = `/api/v1/transaction/${transaction._id}`;
    const vendor2 = UserFactory.build(
      {
        role: USER_ROLE.VENDOR,
        activated: true,
        vendor: { verified: true },
      },
      { generateId: true },
    );
    const editorUser = UserFactory.build(
      { role: USER_ROLE.EDITOR, activated: true },
      { generateId: true },
    );

    beforeEach(async () => {
      vendor2Token = await addUser(vendor2);
      await Transaction.create(transaction);
    });

    context('with valid token', () => {
      [...new Array(2)].map((_, index) =>
        it('returns related transaction', (done) => {
          request()
            .get(`/api/v1/transaction/${transaction._id}`)
            .set('authorization', [vendorToken, adminToken][index])
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.transaction._id).to.be.eql(transaction._id.toString());
              expect(res.body.transaction.propertyId).to.be.eql(transaction.propertyId.toString());
              expect(res.body.transaction.userId).to.be.eql(transaction.userId.toString());
              expect(res.body.transaction.offerId).to.be.eql(transaction.offerId.toString());
              expect(res.body.transaction).to.have.property('remittance');
              done();
            });
        }),
      );
    });

    context('with user token', () => {
      it('returns related transaction', (done) => {
        request()
          .get(`/api/v1/transaction/${transaction._id}`)
          .set('authorization', userToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.transaction._id).to.be.eql(transaction._id.toString());
            expect(res.body.transaction.propertyId).to.be.eql(transaction.propertyId.toString());
            expect(res.body.transaction.userId).to.be.eql(transaction.userId.toString());
            expect(res.body.transaction.offerId).to.be.eql(transaction.offerId.toString());
            expect(res.body.transaction).to.not.have.property('remittance');
            done();
          });
      });
    });

    context('with token with invalid access', () => {
      it('returns not found', (done) => {
        request()
          .get(`/api/v1/transaction/${transaction._id}`)
          .set('authorization', vendor2Token)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Transaction not found');
            done();
          });
      });
    });

    itReturnsForbiddenForTokenWithInvalidAccess({
      endpoint,
      method,
      user: editorUser,
    });

    itReturnsForbiddenForNoToken({ endpoint, method });

    itReturnsNotFoundForInvalidToken({
      endpoint,
      method,
      user: regularUser,
      userId: regularUser._id,
      useExistingUser: true,
    });

    itReturnsAnErrorWhenServiceFails({
      endpoint,
      method,
      user: regularUser,
      model: Transaction,
      modelMethod: 'aggregate',
      useExistingUser: true,
    });
  });

  describe('Add Remittance Route', () => {
    const method = 'put';
    const endpoint = '/api/v1/transaction/remittance';

    const transaction = TransactionFactory.build(
      {
        userId: regularUser._id,
        propertyId: property._id,
        offerId: offer._id,
        vendorId: vendorUser._id,
        addedBy: adminUser._id,
        updatedBy: adminUser._id,
      },
      { generateId: true },
    );

    const data = {
      transactionId: transaction._id,
      amount: 1_000_000,
      date: '2021-02-12',
    };

    beforeEach(async () => {
      await Transaction.create(transaction);
    });

    context('with valid token and data', () => {
      it('adds remittance', (done) => {
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Remittance added');
            expect(res.body.transaction._id).to.be.eql(transaction._id.toString());
            expect(res.body.transaction.remittance.amount).to.be.eql(data.amount);
            expect(res.body.transaction.remittance.by).to.be.eql(adminUser._id.toString());
            expect(res.body.transaction.remittance.date).to.have.string(data.date);
            expect(res.body.transaction.remittance.percentage).to.be.eql(5);
            done();
          });
      });
    });

    context('with invalid transaction id', () => {
      it('returns not found', (done) => {
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .send({ ...data, transactionId: mongoose.Types.ObjectId() })
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Invalid transaction');
            done();
          });
      });
    });

    itReturnsForbiddenForNoToken({ endpoint, method, data });

    itReturnsNotFoundForInvalidToken({
      endpoint,
      method,
      user: adminUser,
      userId: adminUser._id,
      useExistingUser: true,
      data,
    });

    [vendorUser, regularUser].map((user) =>
      itReturnsForbiddenForTokenWithInvalidAccess({
        endpoint,
        method,
        user,
        data,
        useExistingUser: true,
      }),
    );

    context('when addRemittance service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(Transaction, 'findByIdAndUpdate').throws(new Error('Type Error'));
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .send(data)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            Transaction.findByIdAndUpdate.restore();
          });
      });
    });
  });
});
