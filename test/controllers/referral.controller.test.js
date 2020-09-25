import mongoose from 'mongoose';
import { expect, request, sinon, useDatabase } from '../config';
import Referral from '../../server/models/referral.model';
import User from '../../server/models/user.model';
import ReferralFactory from '../factories/referral.factory';
import UserFactory from '../factories/user.factory';
import { addUser } from '../../server/services/user.service';
import { addReferral } from '../../server/services/referral.service';

useDatabase();

let adminToken;
let userToken;
const userId = mongoose.Types.ObjectId();
const adminId = mongoose.Types.ObjectId();
const adminUser = UserFactory.build({
  _id: adminId,
  role: 0,
  activated: true,
  email: 'admin@mail.com',
});
const regularUser = UserFactory.build({
  _id: userId,
  role: 1,
  activated: true,
  email: 'user@mail.com',
});

describe('Referral Controller', () => {
  beforeEach(async () => {
    adminToken = await addUser(adminUser);
    userToken = await addUser(regularUser);
  });

  describe('Referral Invite Route', () => {
    context('with valid data', () => {
      it('returns successful invite', (done) => {
        const invite = ReferralFactory.build({ email: 'invite-1@mail.com' });
        request()
          .post('/api/v1/referral/invite')
          .set('authorization', userToken)
          .send(invite)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Invite sent');
            done();
          });
      });
    });

    context('when an invalid token is used', () => {
      beforeEach(async () => {
        await User.findByIdAndDelete(userId);
      });
      it('returns token error', (done) => {
        const invite = ReferralFactory.build();
        request()
          .post('/api/v1/referral/invite')
          .set('authorization', userToken)
          .send(invite)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Invalid token');
            done();
          });
      });
    });

    context('with invalid data', () => {
      context('when invite email is empty', () => {
        it('returns an error', (done) => {
          const invite = ReferralFactory.build({ email: '' });
          request()
            .post('/api/v1/referral/invite')
            .set('authorization', adminToken)
            .send(invite)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Email Address" is not allowed to be empty');
              done();
            });
        });
      });

      context('when invite email is has been registered', () => {
        it('returns an error', (done) => {
          const invite = ReferralFactory.build({ email: 'admin@mail.com' });
          request()
            .post('/api/v1/referral/invite')
            .set('authorization', adminToken)
            .send(invite)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql(
                'admin@mail.com has already registered on Ballers.',
              );
              done();
            });
        });
      });
    });
  });

  describe('Get all referrals', () => {
    const referral = ReferralFactory.build({ referrerId: adminId });

    context('when no referral is found', () => {
      it('returns not found', (done) => {
        request()
          .get('/api/v1/referral/all')
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.referrals.length).to.be.eql(0);
            done();
          });
      });
    });

    describe('when referrals exist in db', () => {
      beforeEach(async () => {
        await addReferral(referral);
      });

      context('with a valid token & id', () => {
        it('returns successful payload', (done) => {
          request()
            .get('/api/v1/referral/all')
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('referrals');
              expect(res.body.referrals[0]).to.have.property('reward');
              expect(res.body.referrals[0]).to.have.property('status');
              expect(res.body.referrals[0]).to.have.property('referrerId');
              expect(res.body.referrals[0]).to.have.property('email');
              expect(res.body.referrals[0]).to.have.property('referrer');
              expect(res.body.referrals[0].referrer).to.have.property('firstName');
              expect(res.body.referrals[0].referrer).to.have.property('lastName');
              expect(res.body.referrals[0].referrer).to.have.property('email');
              done();
            });
        });
      });

      context('without token', () => {
        it('returns error', (done) => {
          request()
            .get('/api/v1/referral/all')
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Token needed to access resources');
              done();
            });
        });
      });

      context('when token is used', () => {
        beforeEach(async () => {
          await User.findByIdAndDelete(adminId);
        });
        it('returns token error', (done) => {
          request()
            .get('/api/v1/referral/all')
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(404);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Invalid token');
              done();
            });
        });
      });

      context('when getAllReferrals service fails', () => {
        it('returns the error', (done) => {
          sinon.stub(Referral, 'aggregate').throws(new Error('Type Error'));
          request()
            .get('/api/v1/referral/all')
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(500);
              done();
              Referral.aggregate.restore();
            });
        });
      });
    });
  });

  describe('Get all owned referrals', () => {
    const referral1 = ReferralFactory.build({ referrerId: userId, email: 'demo1@mail.com' });
    const referral2 = ReferralFactory.build({ referrerId: adminId, email: 'demo2@mail.com' });
    const referral3 = ReferralFactory.build({ referrerId: userId, email: 'demo3@mail.com' });

    context('when no referral is found', () => {
      it('returns not found', (done) => {
        request()
          .get('/api/v1/referral/')
          .set('authorization', userToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.referrals.length).to.be.eql(0);
            done();
          });
      });
    });

    describe('when referrals exist in db', () => {
      beforeEach(async () => {
        await addReferral(referral1);
        await addReferral(referral2);
        await addReferral(referral3);
      });

      context('with a valid token & id', () => {
        it('returns successful payload', (done) => {
          request()
            .get('/api/v1/referral/')
            .set('authorization', userToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.referrals.length).to.be.eql(2);
              expect(res.body).to.have.property('referrals');
              expect(res.body.referrals[0]).to.have.property('reward');
              expect(res.body.referrals[0]).to.have.property('status');
              expect(res.body.referrals[0]).to.have.property('referrerId');
              expect(res.body.referrals[0]).to.have.property('email');
              expect(res.body.referrals[0]).to.have.property('referrer');
              expect(res.body.referrals[0].referrer).to.have.property('email');
              done();
            });
        });
      });

      context('without token', () => {
        it('returns error', (done) => {
          request()
            .get('/api/v1/referral/')
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Token needed to access resources');
              done();
            });
        });
      });

      context('when token is used', () => {
        beforeEach(async () => {
          await User.findByIdAndDelete(userId);
        });
        it('returns token error', (done) => {
          request()
            .get('/api/v1/referral/')
            .set('authorization', userToken)
            .end((err, res) => {
              expect(res).to.have.status(404);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Invalid token');
              done();
            });
        });
      });

      context('when getAllUserReferrals service fails', () => {
        it('returns the error', (done) => {
          sinon.stub(Referral, 'aggregate').throws(new Error('Type Error'));
          request()
            .get('/api/v1/referral/')
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

  describe('Get user information by referral code', () => {
    const testId = mongoose.Types.ObjectId();
    const referralCode = 'RC1234';
    const referrer = UserFactory.build({ _id: testId, referralCode });

    beforeEach(async () => {
      await User.create(referrer);
    });

    context('with a valid referrl code', () => {
      it('returns successful payload', (done) => {
        request()
          .get(`/api/v1/referral/ref/${referralCode}`)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body).to.have.property('user');
            expect(res.body.user._id).to.be.eql(testId.toString());
            done();
          });
      });
    });

    context('with an invalid offer id', () => {
      it('returns not found', (done) => {
        request()
          .get(`/api/v1/referral/ref/AB1234`)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('User not found');
            done();
          });
      });
    });

    context('when getUserByRefCode service fails', () => {
      it('returns the error', (done) => {
        sinon.stub(User, 'aggregate').throws(new Error('Type Error'));
        request()
          .get(`/api/v1/referral/ref/${referralCode}`)
          .end((err, res) => {
            expect(res).to.have.status(500);
            done();
            User.aggregate.restore();
          });
      });
    });
  });

  describe('Get a referral by the id', () => {
    const referralId = mongoose.Types.ObjectId();
    const invalidId = mongoose.Types.ObjectId();
    const referral = ReferralFactory.build({ _id: referralId, referrerId: adminId });

    beforeEach(async () => {
      await addReferral(referral);
    });

    context('with a valid id', () => {
      it('returns successful payload', (done) => {
        request()
          .get(`/api/v1/referral/${referralId}`)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body).to.have.property('referral');
            done();
          });
      });
    });

    context('with an invalid referral id', () => {
      it('returns not found', (done) => {
        request()
          .get(`/api/v1/referral/${invalidId}`)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Referral not found');
            done();
          });
      });
    });

    context('when getReferralById service fails', () => {
      it('returns the error', (done) => {
        sinon.stub(Referral, 'aggregate').throws(new Error('Type Error'));
        request()
          .get(`/api/v1/referral/${referralId}`)
          .end((err, res) => {
            expect(res).to.have.status(500);
            done();
            Referral.aggregate.restore();
          });
      });
    });
  });
});
