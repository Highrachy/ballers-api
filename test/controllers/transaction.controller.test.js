import { expect, request, sinon } from '../config';
import Transaction from '../../server/models/transaction.model';
import Offer from '../../server/models/offer.model';
import User from '../../server/models/user.model';
import Referral from '../../server/models/referral.model';
import TransactionFactory from '../factories/transaction.factory';
import OfferFactory from '../factories/offer.factory';
import EnquiryFactory from '../factories/enquiry.factory';
import PropertyFactory from '../factories/property.factory';
import UserFactory from '../factories/user.factory';
import ReferralFactory from '../factories/referral.factory';
import { addTransaction } from '../../server/services/transaction.service';
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

  describe('Add Transaction Route', () => {
    const endpoint = '/api/v1/transaction/add';
    const method = 'post';
    const transactionBody = {
      propertyId: property._id,
      offerId: offer._id,
      userId: regularUser._id,
    };
    context('with valid data', () => {
      it('returns successful transaction', (done) => {
        const transaction = TransactionFactory.build(transactionBody);
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .send(transaction)
          .end((err, res) => {
            expect(res).to.have.status(201);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Transaction added');
            expect(res.body).to.have.property('transaction');
            done();
          });
      });
    });

    context('when user token is used', () => {
      beforeEach(async () => {
        await User.findByIdAndDelete(adminUser._id);
      });
      it('returns token error', (done) => {
        const transaction = TransactionFactory.build(transactionBody);
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .send(transaction)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Invalid token');
            done();
          });
      });
    });

    context('with a token without access', () => {
      [...new Array(2)].map((_, index) =>
        it('returns successful payload', (done) => {
          const transaction = TransactionFactory.build(transactionBody);
          request()
            [method](endpoint)
            .set('authorization', [userToken, vendorToken][index])
            .send(transaction)
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('You are not permitted to perform this action');
              done();
            });
        }),
      );
    });

    context('with invalid data', () => {
      context('when user id is empty', () => {
        it('returns an error', (done) => {
          const transaction = TransactionFactory.build({ userId: '' });
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send(transaction)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"User Id" is not allowed to be empty');
              done();
            });
        });
      });
      context('when offer id is empty', () => {
        it('returns an error', (done) => {
          const transaction = TransactionFactory.build({ offerId: '' });
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send(transaction)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Offer Id" is not allowed to be empty');
              done();
            });
        });
      });
      context('when property id is empty', () => {
        it('returns an error', (done) => {
          const transaction = TransactionFactory.build({ propertyId: '' });
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send(transaction)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property Id" is not allowed to be empty');
              done();
            });
        });
      });
      context('when payment source is empty', () => {
        it('returns an error', (done) => {
          const transaction = TransactionFactory.build({ paymentSource: '' });
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send(transaction)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql(
                '"Transaction Payment Source" is not allowed to be empty',
              );
              done();
            });
        });
      });
      context('when amount is empty', () => {
        it('returns an error', (done) => {
          const transaction = TransactionFactory.build({ amount: '' });
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send(transaction)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Transaction Amount" must be a number');
              done();
            });
        });
      });
    });
  });

  describe('Get all transactions', () => {
    let vendor2Token;
    const method = 'get';
    const endpoint = '/api/v1/transaction/all';
    const editorUser = UserFactory.build(
      { role: USER_ROLE.EDITOR, activated: true },
      { generateId: true },
    );
    const vendorTransactions = TransactionFactory.buildList(10, {
      propertyId: property._id,
      offerId: offer._id,
      userId: regularUser._id,
      vendorId: vendorUser._id,
      addedBy: adminUser._id,
      updatedBy: adminUser._id,
    });
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
    const vendor2Transactions = TransactionFactory.buildList(8, {
      propertyId: vendor2Property._id,
      offerId: vendor2Offer._id,
      userId: regularUser._id,
      vendorId: vendor2._id,
      addedBy: adminUser._id,
      updatedBy: adminUser._id,
    });

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
            [method](endpoint)
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
              done();
            });
        });
      });

      context('when vendorToken is used', () => {
        it('returns matched transactons', (done) => {
          request()
            [method](endpoint)
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
            [method](endpoint)
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

  describe('Update Transaction route', () => {
    const endpoint = '/api/v1/transaction/update';
    const method = 'put';
    const transaction = TransactionFactory.build(
      {
        userId: regularUser._id,
        propertyId: property._id,
        offerId: offer._id,
        addedBy: adminUser._id,
        updatedBy: adminUser._id,
      },
      { generateId: true },
    );

    beforeEach(async () => {
      await addTransaction(transaction);
    });

    const updatedTransaction = {
      transactionId: transaction._id,
      paidOn: '2020-05-05',
    };

    context('with valid token', () => {
      it('returns an updated transaction', (done) => {
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .send(updatedTransaction)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Payment date updated');
            expect(res.body).to.have.property('transaction');
            expect(res.body.transaction.paidOn).to.be.eql(
              `${updatedTransaction.paidOn}T00:00:00.000Z`,
            );
            expect(res.body.transaction._id).to.be.eql(updatedTransaction.transactionId.toString());
            done();
          });
      });
    });

    context('without token', () => {
      it('returns error', (done) => {
        request()
          [method](endpoint)
          .send(updatedTransaction)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Token needed to access resources');
            done();
          });
      });
    });

    context('with invalid transaction', () => {
      it('returns validation error', (done) => {
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Validation Error');
            done();
          });
      });
    });

    context('when update service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(Transaction, 'findOneAndUpdate').throws(new Error('Type Error'));
        request()
          [method](endpoint)
          .set('authorization', adminToken)
          .send(updatedTransaction)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            Transaction.findOneAndUpdate.restore();
          });
      });
    });

    context('with invalid data', () => {
      context('when transaction id is empty', () => {
        it('returns an error', (done) => {
          const invalidTransaction = { transactionId: '', paidOn: Date.now() };
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send(invalidTransaction)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Transaction Id" is not allowed to be empty');
              done();
            });
        });
      });
      context('when paid on is empty', () => {
        it('returns an error', (done) => {
          const invalidTransaction = { transactionId: transaction._id, paidOn: '' };
          request()
            [method](endpoint)
            .set('authorization', adminToken)
            .send(invalidTransaction)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Payment Date" must be a valid date');
              done();
            });
        });
      });
    });
  });

  describe('Get User Transactions By Property route', () => {
    const transaction = TransactionFactory.build(
      {
        userId: regularUser._id,
        propertyId: property._id,
        offerId: offer._id,
        addedBy: adminUser._id,
        updatedBy: adminUser._id,
      },
      { generateId: true },
    );

    beforeEach(async () => {
      await addTransaction(transaction);
    });

    context('with valid token', () => {
      it('returns an updated transaction', (done) => {
        request()
          .get(`/api/v1/transaction/property/${property._id}`)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body).to.have.property('transactions');
            expect(res.body.transactions[0]._id).to.be.eql(transaction._id.toString());
            expect(res.body.transactions[0].propertyInfo._id).to.be.eql(property._id.toString());
            expect(res.body.transactions[0].userInfo._id).to.be.eql(regularUser._id.toString());
            done();
          });
      });
    });

    context('without token', () => {
      it('returns error', (done) => {
        request()
          .get(`/api/v1/transaction/property/${property._id}`)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Token needed to access resources');
            done();
          });
      });
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

    context('when getUserTransactionsByProperty service returns an error', () => {
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
          .get('/api/v1/transaction/contribution-rewards')
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
            .get('/api/v1/transaction/contribution-rewards')
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
            .get('/api/v1/transaction/contribution-rewards')
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
            .get('/api/v1/transaction/contribution-rewards')
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
          .get('/api/v1/transaction/referral-rewards')
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
            .get('/api/v1/transaction/referral-rewards')
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
            .get('/api/v1/transaction/referral-rewards')
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
            .get('/api/v1/transaction/referral-rewards')
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
});
