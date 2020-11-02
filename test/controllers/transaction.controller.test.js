import mongoose from 'mongoose';
import { expect, request, sinon, useDatabase } from '../config';
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
import { OFFER_STATUS, REWARD_STATUS } from '../../server/helpers/constants';

useDatabase();

let adminToken;
let userToken;
const userId = mongoose.Types.ObjectId();
const adminId = mongoose.Types.ObjectId();
const adminUser = UserFactory.build({ _id: adminId, role: 0, activated: true, vendorCode: 'HIG' });
const regularUser = UserFactory.build({ _id: userId, role: 1, activated: true });

const propertyId1 = mongoose.Types.ObjectId();
const propertyId2 = mongoose.Types.ObjectId();
const propertyId3 = mongoose.Types.ObjectId();
const property1 = PropertyFactory.build({ _id: propertyId1, addedBy: adminId, updatedBy: adminId });
const property2 = PropertyFactory.build({ _id: propertyId2, addedBy: adminId, updatedBy: adminId });
const property3 = PropertyFactory.build({ _id: propertyId3, addedBy: adminId, updatedBy: adminId });

describe('Transaction Controller', () => {
  beforeEach(async () => {
    adminToken = await addUser(adminUser);
    userToken = await addUser(regularUser);
  });

  describe('Add Transaction Route', () => {
    context('with valid data', () => {
      it('returns successful transaction', (done) => {
        const transaction = TransactionFactory.build();
        request()
          .post('/api/v1/transaction/add')
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
        await User.findByIdAndDelete(adminId);
      });
      it('returns token error', (done) => {
        const transaction = TransactionFactory.build();
        request()
          .post('/api/v1/transaction/add')
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

    context('with invalid data', () => {
      context('when user id is empty', () => {
        it('returns an error', (done) => {
          const transaction = TransactionFactory.build({ userId: '' });
          request()
            .post('/api/v1/transaction/add')
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
            .post('/api/v1/transaction/add')
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
            .post('/api/v1/transaction/add')
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
            .post('/api/v1/transaction/add')
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
            .post('/api/v1/transaction/add')
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
    const propertyId = mongoose.Types.ObjectId();
    const transactionId = mongoose.Types.ObjectId();
    const property = PropertyFactory.build({
      _id: propertyId,
      addedBy: adminId,
      updatedBy: adminId,
    });
    const transaction = TransactionFactory.build({
      _id: transactionId,
      propertyId,
      userId: adminId,
      adminId,
    });

    context('when no transaction is found', () => {
      it('returns empty array of transactions', (done) => {
        request()
          .get('/api/v1/transaction/all')
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body).to.have.property('transactions');
            expect(res.body.transactions.length).to.be.eql(0);
            done();
          });
      });
    });

    describe('when transactions exist in db', () => {
      before(async () => {
        await addProperty(property);
        await addTransaction(transaction);
        await addTransaction(TransactionFactory.build());
      });

      context('with a valid token & id', async () => {
        it('returns successful payload', (done) => {
          request()
            .get('/api/v1/transaction/all')
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('transactions');
              expect(res.body.transactions[0]._id).to.be.eql(transactionId.toString());
              expect(res.body.transactions[0].userInfo._id).to.be.eql(adminId.toString());
              expect(res.body.transactions[0].propertyInfo._id).to.be.eql(propertyId.toString());
              done();
            });
        });
      });

      context('without token', () => {
        it('returns error', (done) => {
          request()
            .get('/api/v1/transaction/all')
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Token needed to access resources');
              done();
            });
        });
      });

      context('when user token is used', () => {
        it('returns forbidden error', (done) => {
          request()
            .get('/api/v1/transaction/all')
            .set('authorization', userToken)
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('You are not permitted to perform this action');
              done();
            });
        });
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

  describe('Update Transaction route', () => {
    const transactionId = mongoose.Types.ObjectId();
    const transaction = TransactionFactory.build({ _id: transactionId, userId, adminId });

    beforeEach(async () => {
      await addTransaction(transaction);
    });

    const updatedTransaction = {
      transactionId,
      paidOn: '2020-05-05',
    };

    context('with valid token', () => {
      it('returns an updated transaction', (done) => {
        request()
          .put('/api/v1/transaction/update')
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
          .put('/api/v1/transaction/update')
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
          .put('/api/v1/transaction/update')
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
          .put('/api/v1/transaction/update')
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
            .put('/api/v1/transaction/update')
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
          const invalidTransaction = { transactionId, paidOn: '' };
          request()
            .put('/api/v1/transaction/update')
            .set('authorization', adminToken)
            .send(invalidTransaction)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Payment Date" is not allowed to be empty');
              done();
            });
        });
      });
    });
  });

  describe('Get all transactions made by a user route', () => {
    const propertyId = mongoose.Types.ObjectId();
    const transactionId = mongoose.Types.ObjectId();
    const property = PropertyFactory.build({
      _id: propertyId,
      addedBy: adminId,
      updatedBy: adminId,
    });
    const transaction = TransactionFactory.build({
      _id: transactionId,
      propertyId,
      userId: adminId,
      adminId,
    });

    context('when no transaction is found', () => {
      it('returns empty array of transactions', (done) => {
        request()
          .get('/api/v1/transaction/user')
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body).to.have.property('transactions');
            expect(res.body.transactions.length).to.be.eql(0);
            done();
          });
      });
    });

    describe('when transactions exist in db', () => {
      before(async () => {
        await addProperty(property);
        await addTransaction(transaction);
      });

      context('with a valid token & id', async () => {
        it('returns successful payload', (done) => {
          request()
            .get('/api/v1/transaction/user')
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('transactions');
              expect(res.body.transactions[0]).to.have.property('propertyId');
              expect(res.body.transactions[0]).to.have.property('userId');
              expect(res.body.transactions[0]).to.have.property('paymentSource');
              expect(res.body.transactions[0]).to.have.property('amount');
              expect(res.body.transactions[0]).to.have.property('adminId');
              expect(res.body.transactions[0]._id).to.be.eql(transactionId.toString());
              expect(res.body.transactions[0].propertyInfo._id).to.be.eql(propertyId.toString());
              expect(res.body.transactions[0].propertyInfo).to.have.property('name');
              expect(res.body.transactions[0].propertyInfo).to.have.property('mainImage');
              done();
            });
        });
      });

      context('without token', () => {
        it('returns error', (done) => {
          request()
            .get('/api/v1/transaction/user')
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Token needed to access resources');
              done();
            });
        });
      });

      context('when user token is used', () => {
        it('returns successful payload', (done) => {
          request()
            .get('/api/v1/transaction/user')
            .set('authorization', userToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              done();
            });
        });
      });

      context('when getTransactionsByUser service fails', () => {
        it('returns the error', (done) => {
          sinon.stub(Transaction, 'aggregate').throws(new Error('Type Error'));
          request()
            .get('/api/v1/transaction/user')
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
    const propertyId = mongoose.Types.ObjectId();
    const transactionId = mongoose.Types.ObjectId();
    const property = PropertyFactory.build({
      _id: propertyId,
      addedBy: adminId,
      updatedBy: adminId,
    });
    const transaction = TransactionFactory.build({
      _id: transactionId,
      propertyId,
      userId: adminId,
      adminId,
    });

    beforeEach(async () => {
      await addProperty(property);
      await addTransaction(transaction);
    });

    context('with valid token', () => {
      it('returns an updated transaction', (done) => {
        request()
          .get(`/api/v1/transaction/property/${propertyId}`)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body).to.have.property('transactions');
            expect(res.body.transactions[0]._id).to.be.eql(transactionId.toString());
            expect(res.body.transactions[0].propertyInfo._id).to.be.eql(propertyId.toString());
            expect(res.body.transactions[0].userInfo._id).to.be.eql(adminId.toString());
            done();
          });
      });
    });

    context('without token', () => {
      it('returns error', (done) => {
        request()
          .get(`/api/v1/transaction/property/${propertyId}`)
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
          .get(`/api/v1/transaction/property/${propertyId}s`)
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
          .get(`/api/v1/transaction/property/${propertyId}`)
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
    const allocatedEnquiryId = mongoose.Types.ObjectId();
    const allocatedEnquiry = EnquiryFactory.build({
      _id: allocatedEnquiryId,
      userId,
      propertyId: propertyId1,
    });
    const allocatedOfferId = mongoose.Types.ObjectId();
    const allocatedOffer = OfferFactory.build({
      _id: allocatedOfferId,
      enquiryId: allocatedEnquiryId,
      vendorId: adminId,
      status: OFFER_STATUS.ALLOCATED,
      contributionReward: 50000,
    });

    const neglectedEnquiryId = mongoose.Types.ObjectId();
    const neglectedEnquiry = EnquiryFactory.build({
      _id: neglectedEnquiryId,
      userId,
      propertyId: propertyId2,
    });
    const neglectedOfferId = mongoose.Types.ObjectId();
    const neglectedOffer = OfferFactory.build({
      _id: neglectedOfferId,
      enquiryId: neglectedEnquiryId,
      vendorId: adminId,
      status: OFFER_STATUS.NEGLECTED,
    });

    const assignedEnquiryId = mongoose.Types.ObjectId();
    const assignedEnquiry = EnquiryFactory.build({
      _id: assignedEnquiryId,
      userId,
      propertyId: propertyId3,
    });
    const assignedOfferId = mongoose.Types.ObjectId();
    const assignedOffer = OfferFactory.build({
      _id: assignedOfferId,
      enquiryId: assignedEnquiryId,
      vendorId: adminId,
      status: OFFER_STATUS.ASSIGNED,
      contributionReward: 70000,
    });

    context('when no contribution reward is found', () => {
      it('returns empty array of contribution reward', (done) => {
        request()
          .get('/api/v1/transaction/user/contribution-rewards')
          .set('authorization', userToken)
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
            .set('authorization', userToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('contributionRewards');
              expect(res.body.contributionRewards.length).to.be.eql(2);
              expect(res.body.contributionRewards[0]._id).to.be.eql(allocatedOfferId.toString());
              expect(res.body.contributionRewards[1]._id).to.be.eql(assignedOfferId.toString());
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
            .set('authorization', userToken)
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
    const referral1 = ReferralFactory.build({
      referrerId: userId,
      email: 'demo1@mail.com',
      reward: {
        amount: 10000,
        status: REWARD_STATUS.PAID,
      },
    });
    const referral2 = ReferralFactory.build({
      referrerId: adminId,
      email: 'demo1@mail.com',
      reward: {
        status: REWARD_STATUS.PENDING,
      },
    });
    const referral3 = ReferralFactory.build({
      referrerId: userId,
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
        await addReferral(referral1);
        await addReferral(referral2);
        await addReferral(referral3);
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
              expect(res.body.referralRewards[0].referrerId).to.be.eql(userId.toString());
              expect(res.body.referralRewards[0].reward.status).to.be.eql(referral1.reward.status);
              expect(res.body.referralRewards[0].reward.amount).to.be.eql(referral1.reward.amount);
              expect(res.body.referralRewards[1].referrerId).to.be.eql(userId.toString());
              expect(res.body.referralRewards[1].reward.status).to.be.eql(referral3.reward.status);
              expect(res.body.referralRewards[1].reward.amount).to.be.eql(referral3.reward.amount);
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
});
