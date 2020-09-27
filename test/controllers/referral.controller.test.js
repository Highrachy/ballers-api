import mongoose from 'mongoose';
import { expect, request, sinon, useDatabase } from '../config';
import Referral from '../../server/models/referral.model';
import User from '../../server/models/user.model';
import ReferralFactory from '../factories/referral.factory';
import UserFactory from '../factories/user.factory';
import { addUser } from '../../server/services/user.service';
import { addReferral, sendReferralInvite } from '../../server/services/referral.service';
import { REFERRAL_STATUS, REWARD_STATUS } from '../../server/helpers/constants';

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
        const invite = { email: 'invite-1@mail.com', firstName: 'John' };
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

    context('with first name is absent', () => {
      it('returns successful invite', (done) => {
        const invite = { email: 'invite-2@mail.com' };
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

      context('when invite email is not sent', () => {
        it('returns an error', (done) => {
          const invite = { firstName: 'John' };
          request()
            .post('/api/v1/referral/invite')
            .set('authorization', adminToken)
            .send(invite)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Email Address" is required');
              done();
            });
        });
      });

      context('when email that has been invited by another user but has not registered', () => {
        const email = 'invite-1@mail.com';
        beforeEach(async () => {
          await sendReferralInvite({ email, referrerId: userId });
        });
        it('returns successful invite', (done) => {
          const invite = { email, firstName: 'John' };
          request()
            .post('/api/v1/referral/invite')
            .set('authorization', adminToken)
            .send(invite)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Invite sent');
              done();
            });
        });
      });

      context('when user has sent invite to email previously', () => {
        const email = 'invite-1@mail.com';
        beforeEach(async () => {
          await sendReferralInvite({ email, referrerId: userId });
        });
        it('returns successful invite', (done) => {
          const invite = { email, firstName: 'John' };
          request()
            .post('/api/v1/referral/invite')
            .set('authorization', userToken)
            .send(invite)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Multiple invites cannot be sent to same email');
              done();
            });
        });
      });

      context('when invite email is a registered user', () => {
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
    const referral1 = ReferralFactory.build({ referrerId: adminId, email: 'demo-1@mail.com' });
    const referral2 = ReferralFactory.build({ referrerId: adminId, email: 'demo-2@mail.com' });

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
        await addReferral(referral1);
        await addReferral(referral2);
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
              expect(res.body.referrals[0].referrerId).to.be.eql(adminId.toString());
              expect(res.body.referrals[0]).to.have.property('email');
              expect(res.body.referrals[0].email).to.be.eql('demo-1@mail.com');
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

      context('when an invalid token is used', () => {
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
              expect(res.body.referrals[0].referrerId).to.be.eql(userId.toString());
              expect(res.body.referrals[0]).to.have.property('email');
              expect(res.body.referrals[0].email).to.be.eql('demo1@mail.com');
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

      context('when an invalid token is used', () => {
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
    const email = 'referrer@mail.com';
    const firstName = 'Sammy';
    const referrer = UserFactory.build({ _id: testId, referralCode, email, firstName });

    beforeEach(async () => {
      await User.create(referrer);
    });

    context('with a valid referral code', () => {
      it('returns successful payload', (done) => {
        request()
          .get(`/api/v1/referral/ref/${referralCode}`)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body).to.have.property('user');
            expect(res.body.user._id).to.be.eql(testId.toString());
            expect(res.body.user.firstName).to.be.eql(firstName);
            expect(res.body.user.email).to.be.eql(email);
            expect(res.body.user).to.not.have.property('password');
            done();
          });
      });
    });

    context('with an invalid referral id', () => {
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

  describe('Reward a referral', () => {
    const referralId = mongoose.Types.ObjectId();
    const invalidId = mongoose.Types.ObjectId();
    const referral = ReferralFactory.build({ _id: referralId, referrerId: adminId });

    const referralDetails = {
      referralId,
    };

    beforeEach(async () => {
      await addReferral(referral);
    });

    context('with valid data & token', () => {
      it('returns assigned referral', (done) => {
        request()
          .put('/api/v1/referral/rewarded')
          .set('authorization', adminToken)
          .send(referralDetails)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Referral rewarded');
            expect(res.body).to.have.property('referral');
            expect(res.body.referral._id).to.be.eql(referralId.toString());
            expect(res.body.referral.status).to.be.eql(REFERRAL_STATUS.REWARDED);
            expect(res.body.referral.reward.status).to.be.eql(REWARD_STATUS.PAID);
            done();
          });
      });
    });

    context('without token', () => {
      it('returns error', (done) => {
        request()
          .put('/api/v1/referral/rewarded')
          .send(referralDetails)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Token needed to access resources');
            done();
          });
      });
    });

    context('with unauthorized user access token', () => {
      it('returns error', (done) => {
        request()
          .put('/api/v1/referral/rewarded')
          .set('authorization', userToken)
          .send(referralDetails)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('You are not permitted to perform this action');
            done();
          });
      });
    });

    context('when updateReferralToRewarded service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(Referral, 'findByIdAndUpdate').throws(new Error('Type Error'));
        request()
          .put('/api/v1/referral/rewarded')
          .set('authorization', adminToken)
          .send(referralDetails)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            Referral.findByIdAndUpdate.restore();
          });
      });
    });

    context('with invalid data', () => {
      context('when referral id is empty', () => {
        it('returns an error', (done) => {
          const invalidData = { referralId: '' };
          request()
            .put('/api/v1/referral/rewarded')
            .set('authorization', adminToken)
            .send(invalidData)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Referral Id" is not allowed to be empty');
              done();
            });
        });
      });
      context('when invalid referral id', () => {
        it('returns an error', (done) => {
          const invalidData = { referralId: invalidId };
          request()
            .put('/api/v1/referral/rewarded')
            .set('authorization', adminToken)
            .send(invalidData)
            .end((err, res) => {
              expect(res).to.have.status(400);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Error rewarding referral');
              done();
            });
        });
      });
    });
  });
});
