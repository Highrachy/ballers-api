import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { expect, request, sinon, useDatabase } from '../config';
import User from '../../server/models/user.model';
import { addUser } from '../../server/services/user.service';
import { addProperty } from '../../server/services/property.service';
import UserFactory from '../factories/user.factory';
import PropertyFactory from '../factories/property.factory';
import * as MailService from '../../server/services/mailer.service';
import EMAIL_CONTENT from '../../mailer';
import Upload from '../../server/helpers/uploadImage';
import { addReferral, sendReferralInvite } from '../../server/services/referral.service';
import OfferFactory from '../factories/offer.factory';
import EnquiryFactory from '../factories/enquiry.factory';
import TransactionFactory from '../factories/transaction.factory';
import ReferralFactory from '../factories/referral.factory';
import { addEnquiry } from '../../server/services/enquiry.service';
import { createOffer, acceptOffer, assignOffer } from '../../server/services/offer.service';
import { addTransaction } from '../../server/services/transaction.service';
import { OFFER_STATUS } from '../../server/helpers/constants';

useDatabase();

let sendMailSpy;
const sandbox = sinon.createSandbox();

describe('User Controller', () => {
  beforeEach(() => {
    sendMailSpy = sandbox.spy(MailService, 'sendMail');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('Register Route', () => {
    context('with valid data', () => {
      it('returns successful token', (done) => {
        const user = UserFactory.build({ email: 'myemail@mail.com' });
        request()
          .post('/api/v1/user/register')
          .send(user)
          .end((err, res) => {
            expect(res).to.have.status(201);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('User registered');
            expect(res.body).to.have.property('token');
            expect(sendMailSpy.callCount).to.eq(1);
            expect(sendMailSpy).to.have.be.calledWith(EMAIL_CONTENT.ACTIVATE_YOUR_ACCOUNT, user, {
              link: `http://ballers.ng/activate?token=${res.body.token}`,
            });
            done();
          });
      });
    });
    context('when email exists in the db', () => {
      const user = UserFactory.build({ email: 'myemail@mail.com' });
      before(async () => {
        await User.create(user);
      });
      it('returns error for an existing email', (done) => {
        request()
          .post('/api/v1/user/register')
          .send(user)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Email is linked to another account');
            expect(res.body.error).to.be.eql('Email is linked to another account');
            expect(sendMailSpy.callCount).to.eq(0);
            done();
          });
      });
    });

    context('when user was invited before registering', () => {
      const registeredUserId = mongoose.Types.ObjectId();
      const referralCode = 'RC1234';
      const registeredUser = UserFactory.build({
        _id: registeredUserId,
        referralCode,
      });
      const email = 'newuser@mail.com';
      const user = UserFactory.build({ email, referralCode });
      before(async () => {
        await User.create(registeredUser);
        await sendReferralInvite({ email, referrerId: registeredUserId });
      });
      it('returns successful token', (done) => {
        request()
          .post('/api/v1/user/register')
          .send(user)
          .end((err, res) => {
            expect(res).to.have.status(201);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('User registered');
            expect(res.body).to.have.property('token');
            expect(sendMailSpy.callCount).to.eq(1);
            done();
          });
      });
    });

    context('with invalid data', () => {
      context('when firstName is empty', () => {
        it('returns an error', (done) => {
          const user = UserFactory.build({ firstName: '' });
          request()
            .post('/api/v1/user/register')
            .send(user)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"First Name" is not allowed to be empty');
              expect(sendMailSpy.callCount).to.eq(0);
              done();
            });
        });
      });

      context('when lastName is empty', () => {
        it('returns an error', (done) => {
          const user = UserFactory.build({ lastName: '' });
          request()
            .post('/api/v1/user/register')
            .send(user)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Last Name" is not allowed to be empty');
              expect(sendMailSpy.callCount).to.eq(0);
              done();
            });
        });
      });

      context('when email is empty', () => {
        it('returns an error', (done) => {
          const user = UserFactory.build({ email: '' });
          request()
            .post('/api/v1/user/register')
            .send(user)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Email Address" is not allowed to be empty');
              expect(sendMailSpy.callCount).to.eq(0);
              done();
            });
        });
      });

      context('with invalid email address', () => {
        it('returns an error', (done) => {
          const user = UserFactory.build({ email: 'wrong-email' });
          request()
            .post('/api/v1/user/register')
            .send(user)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Email Address" must be a valid email');
              expect(sendMailSpy.callCount).to.eq(0);
              done();
            });
        });
      });

      context('when password is empty', () => {
        it('returns an error', (done) => {
          const user = UserFactory.build({ password: '' });
          request()
            .post('/api/v1/user/register')
            .send(user)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Password" is not allowed to be empty');
              expect(sendMailSpy.callCount).to.eq(0);
              done();
            });
        });
      });

      context('when password is weak', () => {
        it('returns an error', (done) => {
          const user = UserFactory.build({ password: '123' });
          request()
            .post('/api/v1/user/register')
            .send(user)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql(
                '"Password" length must be at least 6 characters long',
              );
              expect(sendMailSpy.callCount).to.eq(0);
              done();
            });
        });
      });

      context('when confirm password is empty', () => {
        it('returns an error', (done) => {
          const user = UserFactory.build({ confirmPassword: '' });
          request()
            .post('/api/v1/user/register')
            .send(user)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('Password does not match');
              expect(sendMailSpy.callCount).to.eq(0);
              done();
            });
        });
      });

      context('when confirm password is not equal to password', () => {
        it('returns an error', (done) => {
          const user = UserFactory.build({ password: '123456', confirmPassword: '000000' });
          request()
            .post('/api/v1/user/register')
            .send(user)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('Password does not match');
              expect(sendMailSpy.callCount).to.eq(0);
              done();
            });
        });
      });
    });

    context('when phone number is empty', () => {
      it('registers the user', (done) => {
        const user = UserFactory.build({ phone: '' });
        request()
          .post('/api/v1/user/register')
          .send(user)
          .end((err, res) => {
            expect(res).to.have.status(201);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('User registered');
            expect(res.body).to.have.property('token');
            expect(sendMailSpy.callCount).to.eq(1);
            done();
          });
      });
    });

    context('when phone number is not given', () => {
      it('returns an error', (done) => {
        const user = UserFactory.build();
        delete user.phone;
        request()
          .post('/api/v1/user/register')
          .send(user)
          .end((err, res) => {
            expect(res).to.have.status(201);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('User registered');
            expect(res.body).to.have.property('token');
            expect(sendMailSpy.callCount).to.eq(1);
            done();
          });
      });
    });
  });

  describe('Login Route', () => {
    describe('when the user has been activated', () => {
      const userLogin = { email: 'myemail@mail.com', password: '123456' };
      const user = UserFactory.build({ ...userLogin, activated: true });
      beforeEach(async () => {
        await addUser(user);
      });

      context('with valid data', () => {
        it('returns successful payload', (done) => {
          request()
            .post('/api/v1/user/login')
            .send(userLogin)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Login successful');
              expect(res.body.user.firstName).to.be.eql(user.firstName);
              expect(res.body.user.lastName).to.be.eql(user.lastName);
              expect(res.body.user.email).to.be.eql(user.email);
              expect(res.body.user).to.have.property('token');
              done();
            });
        });
      });

      context('with empty email', () => {
        it('returns error', (done) => {
          request()
            .post('/api/v1/user/login')
            .send({ ...userLogin, email: '' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Email Address" is not allowed to be empty');
              done();
            });
        });
      });

      context('with empty password', () => {
        it('returns error', (done) => {
          request()
            .post('/api/v1/user/login')
            .send({ ...userLogin, password: '' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Password" is not allowed to be empty');
              done();
            });
        });
      });

      context('when login service returns an error', () => {
        it('returns the error', (done) => {
          sinon.stub(User, 'findOne').throws(new Error('Type Error'));
          request()
            .post('/api/v1/user/login')
            .send(userLogin)
            .end((err, res) => {
              expect(res).to.have.status(500);
              expect(res.body.success).to.be.eql(false);
              done();
              User.findOne.restore();
            });
        });
      });

      context('when compare error returns an error', () => {
        it('returns the error', (done) => {
          sinon.stub(bcrypt, 'compare').throws(new Error('testing'));
          request()
            .post('/api/v1/user/login')
            .send(userLogin)
            .end((err, res) => {
              expect(res).to.have.status(500);
              expect(res.body.success).to.be.eql(false);
              done();
              bcrypt.compare.restore();
            });
        });
      });
    });

    describe('when the user has not activated', () => {
      const userLogin = { email: 'myemail@mail.com', password: '123456' };
      const user = UserFactory.build({ ...userLogin, activated: false });
      beforeEach(async () => {
        await addUser(user);
      });

      context('with valid data', () => {
        it('returns successful payload', (done) => {
          request()
            .post('/api/v1/user/login')
            .send(userLogin)
            .end((err, res) => {
              expect(res).to.have.status(401);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Your account needs to be activated.');
              expect(res.body.error).to.be.eql('Your account needs to be activated.');
              done();
            });
        });
      });
    });
  });

  describe('Activate User Route', () => {
    let token;
    const user = UserFactory.build({ activated: false });

    beforeEach(async () => {
      token = await addUser(user);
    });
    context('with a valid token', () => {
      it('returns successful payload', (done) => {
        request()
          .get(`/api/v1/user/activate?token=${token}`)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.user.firstName).to.be.eql(user.firstName);
            expect(res.body.user.lastName).to.be.eql(user.lastName);
            expect(res.body.user.email).to.be.eql(user.email);
            expect(res.body.user.activated).to.be.eql(true);
            expect(res.body.user.token).to.be.eql(token);
            expect(res.body.user).to.have.property('activationDate');
            expect(sendMailSpy.callCount).to.eq(1);
            expect(sendMailSpy).to.have.be.calledWith(EMAIL_CONTENT.WELCOME_MESSAGE);
            done();
          });
      });
    });

    context('with an invalid token', () => {
      it('returns successful payload', (done) => {
        request()
          .get(`/api/v1/user/activate?token=${token}1234a56`)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(sendMailSpy.callCount).to.eq(0);
            done();
          });
      });
    });
  });

  describe('Generate a Password Reset Link', () => {
    const email = 'myemail@mail.com';
    const user = UserFactory.build({ email });

    beforeEach(async () => {
      await addUser(user);
    });

    context('with a valid token', () => {
      it('returns successful payload', (done) => {
        request()
          .post('/api/v1/user/reset-password')
          .send({ email })
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql(
              'A password reset link has been sent to your email account',
            );
            expect(sendMailSpy.callCount).to.eq(1);
            expect(sendMailSpy).to.have.be.calledWith(EMAIL_CONTENT.RESET_PASSWORD_LINK);
            done();
          });
      });
    });

    context('with an invalid email', () => {
      it('returns successful payload', (done) => {
        request()
          .post('/api/v1/user/reset-password')
          .send({ email: 'invalid@email.com' })
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Your email address is not found.');
            expect(res.body.error).to.be.eql('Your email address is not found.');
            expect(sendMailSpy.callCount).to.eq(0);
            done();
          });
      });
    });
  });

  describe('Change Password from Reset Link', () => {
    let token;
    const password = '123@ABC';
    const confirmPassword = '123@ABC';
    const user = UserFactory.build();

    beforeEach(async () => {
      token = await addUser(user);
    });

    context('with a valid token', () => {
      it('returns successful payload', (done) => {
        request()
          .post(`/api/v1/user/change-password/${token}`)
          .send({ password, confirmPassword })
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Your password has been successfully changed');
            expect(sendMailSpy.callCount).to.eq(1);
            expect(sendMailSpy).to.have.be.calledWith(EMAIL_CONTENT.CHANGE_PASSWORD);
            done();
          });
      });
    });

    context('when password is empty', () => {
      it('returns an error', (done) => {
        request()
          .post(`/api/v1/user/change-password/${token}`)
          .send({ password: '', confirmPassword })
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Validation Error');
            expect(res.body.error).to.be.eql('"Password" is not allowed to be empty');
            expect(sendMailSpy.callCount).to.eq(0);
            done();
          });
      });
    });

    context('when password is weak', () => {
      it('returns an error', (done) => {
        request()
          .post(`/api/v1/user/change-password/${token}`)
          .send({ password: '123', confirmPassword })
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Validation Error');
            expect(res.body.error).to.be.eql(
              '"Password" length must be at least 6 characters long',
            );
            expect(sendMailSpy.callCount).to.eq(0);
            done();
          });
      });
    });

    context('when confirm password is empty', () => {
      it('returns an error', (done) => {
        request()
          .post(`/api/v1/user/change-password/${token}`)
          .send({ password, confirmPassword: '' })
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Validation Error');
            expect(res.body.error).to.be.eql('Password does not match');
            expect(sendMailSpy.callCount).to.eq(0);
            done();
          });
      });
    });

    context('when confirm password is not equal to password', () => {
      it('returns an error', (done) => {
        request()
          .post(`/api/v1/user/change-password/${token}`)
          .send({ password, confirmPassword: '000000' })
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Validation Error');
            expect(res.body.error).to.be.eql('Password does not match');
            expect(sendMailSpy.callCount).to.eq(0);
            done();
          });
      });
    });

    context('with invalid token', () => {
      it('returns an error', (done) => {
        request()
          .post(`/api/v1/user/change-password/123456`)
          .send({ password, confirmPassword })
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('User not found');
            expect(sendMailSpy.callCount).to.eq(0);
            done();
          });
      });
    });
  });

  describe('Current User', () => {
    let token;
    const user = UserFactory.build();

    beforeEach(async () => {
      token = await addUser(user);
    });

    context('with no token', () => {
      it('returns a forbidden error', (done) => {
        request()
          .get('/api/v1/user/who-am-i')
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Token needed to access resources');
            done();
          });
      });
    });

    context('with invalid token', () => {
      it('returns an authorization error', (done) => {
        request()
          .get('/api/v1/user/who-am-i')
          .set('authorization', 'invalid-token')
          .end((err, res) => {
            expect(res).to.have.status(401);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Authentication Failed');
            done();
          });
      });
    });

    context('with valid token', () => {
      it('returns a valid user', (done) => {
        request()
          .get('/api/v1/user/who-am-i')
          .set('authorization', token)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.user.firstName).to.be.eql(user.firstName);
            expect(res.body.user.lastName).to.be.eql(user.lastName);
            expect(res.body.user.email).to.be.eql(user.email);
            expect(res.body.user).to.not.have.property('password');
            done();
          });
      });
    });

    context('when user is not found', () => {
      beforeEach(async () => {
        await User.deleteOne({ firstName: user.firstName });
      });
      it('returns token error', (done) => {
        request()
          .get('/api/v1/user/who-am-i')
          .set('authorization', token)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Invalid token');
            done();
          });
      });
    });
  });

  describe('Update User route', () => {
    let token;
    const user = UserFactory.build();

    beforeEach(async () => {
      token = await addUser(user);
    });

    const newUser = {
      firstName: 'John',
      lastName: 'Doe',
      phone: '08012345678',
    };

    context('with valid token', () => {
      it('returns a updated user', (done) => {
        request()
          .put('/api/v1/user/update')
          .set('authorization', token)
          .send(newUser)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body).to.have.property('user');
            expect(res.body.user.firstName).to.be.eql(newUser.firstName);
            expect(res.body.user.lastName).to.be.eql(newUser.lastName);
            expect(res.body.user.phone).to.be.eql(newUser.phone);
            done();
          });
      });
    });

    context('without token', () => {
      it('returns error', (done) => {
        request()
          .put('/api/v1/user/update')
          .send(newUser)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Token needed to access resources');
            done();
          });
      });
    });

    context('with invalid updated user', () => {
      it('returns a updated user', (done) => {
        request()
          .put('/api/v1/user/update')
          .set('authorization', token)
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
        sinon.stub(User, 'findOneAndUpdate').throws(new Error('Type Error'));
        request()
          .put('/api/v1/user/update')
          .set('authorization', token)
          .send(newUser)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            User.findOneAndUpdate.restore();
          });
      });
    });

    context('with invalid data', () => {
      context('when first name is empty', () => {
        it('returns an error', (done) => {
          const invalidUser = UserFactory.build({ firstName: '' });
          request()
            .put('/api/v1/user/update')
            .set('authorization', token)
            .send(invalidUser)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"First Name" is not allowed to be empty');
              done();
            });
        });
      });

      context('when preferences house type is empty', () => {
        it('returns an error', (done) => {
          const invalidUser = UserFactory.build({ preferences: { houseType: '' } });
          request()
            .put('/api/v1/user/update')
            .set('authorization', token)
            .send(invalidUser)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property House Type" is not allowed to be empty');
              done();
            });
        });
      });
      context('when preferences location is empty', () => {
        it('returns an error', (done) => {
          const invalidUser = UserFactory.build({ preferences: { location: '' } });
          request()
            .put('/api/v1/user/update')
            .set('authorization', token)
            .send(invalidUser)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property Location" is not allowed to be empty');
              done();
            });
        });
      });
      context('when preferences max price is empty', () => {
        it('returns an error', (done) => {
          const invalidUser = UserFactory.build({ preferences: { maxPrice: '' } });
          request()
            .put('/api/v1/user/update')
            .set('authorization', token)
            .send(invalidUser)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property Maximum Price" must be a number');
              done();
            });
        });
      });
      context('when preferences min price is empty', () => {
        it('returns an error', (done) => {
          const invalidUser = UserFactory.build({ preferences: { minPrice: '' } });
          request()
            .put('/api/v1/user/update')
            .set('authorization', token)
            .send(invalidUser)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property Minimum Price" must be a number');
              done();
            });
        });
      });
    });
  });

  describe('Get all users', () => {
    describe('when users exist in db', () => {
      let adminToken;
      let userToken;
      const _id = mongoose.Types.ObjectId();
      const adminUser = UserFactory.build({ _id, role: 0, activated: true });
      const regularUser = UserFactory.build({ role: 1, activated: true });

      beforeEach(async () => {
        adminToken = await addUser(adminUser);
        userToken = await addUser(regularUser);
      });

      context('with a valid token & id', () => {
        it('returns successful payload', (done) => {
          request()
            .get('/api/v1/user/all')
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('users');
              expect(res.body.users[0]).to.have.property('assignedProperties');
              done();
            });
        });
      });

      context('with a user access token', () => {
        it('returns successful payload', (done) => {
          request()
            .get('/api/v1/user/all')
            .set('authorization', userToken)
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('You are not permitted to perform this action');
              done();
            });
        });
      });

      context('without token', () => {
        it('returns error', (done) => {
          request()
            .get('/api/v1/user/all')
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Token needed to access resources');
              done();
            });
        });
      });

      context('when token is invalid', () => {
        beforeEach(async () => {
          await User.findByIdAndDelete(_id);
        });
        it('returns token error', (done) => {
          request()
            .get('/api/v1/user/all')
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(404);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Invalid token');
              done();
            });
        });
      });

      context('when getAllRegisteredUsers service fails', () => {
        it('returns the error', (done) => {
          sinon.stub(User, 'aggregate').throws(new Error('Type Error'));
          request()
            .get('/api/v1/user/all')
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(500);
              done();
              User.aggregate.restore();
            });
        });
      });
    });
  });

  describe('Add property to favorite route', () => {
    let userToken;
    const _id = mongoose.Types.ObjectId();
    const propertyId = mongoose.Types.ObjectId();
    const property = PropertyFactory.build({ _id: propertyId, addedBy: _id, updatedBy: _id });
    const regularUser = UserFactory.build({ role: 1, activated: true });

    beforeEach(async () => {
      userToken = await addUser(regularUser);
      await addProperty(property);
    });

    const favorite = {
      propertyId,
    };

    context('with right details', () => {
      it('returns property added to favorites', (done) => {
        request()
          .post('/api/v1/user/add-to-favorites')
          .set('authorization', userToken)
          .send(favorite)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Property added to favorites');
            done();
          });
      });
    });

    context('without token', () => {
      it('returns error', (done) => {
        request()
          .post('/api/v1/user/add-to-favorites')
          .send(favorite)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Token needed to access resources');
            done();
          });
      });
    });

    context('with invalid property id sent', () => {
      it('returns a validation error', (done) => {
        request()
          .post('/api/v1/user/add-to-favorites')
          .set('authorization', userToken)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Validation Error');
            done();
          });
      });
    });

    context('when addPropertyToFavorites service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(User, 'findByIdAndUpdate').throws(new Error('Type Error'));
        request()
          .post('/api/v1/user/add-to-favorites')
          .set('authorization', userToken)
          .send(favorite)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            User.findByIdAndUpdate.restore();
          });
      });
    });
  });

  describe('Remove property from favorite route', () => {
    let userToken;
    const propertyId = mongoose.Types.ObjectId();
    const regularUser = UserFactory.build({ role: 1, activated: true });

    beforeEach(async () => {
      userToken = await addUser(regularUser);
    });

    const favorite = {
      propertyId,
    };

    context('with right details', () => {
      it('returns property added to favorites', (done) => {
        request()
          .post('/api/v1/user/remove-favorite')
          .set('authorization', userToken)
          .send(favorite)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Property removed from favorites');
            done();
          });
      });
    });

    context('without token', () => {
      it('returns error', (done) => {
        request()
          .post('/api/v1/user/remove-favorite')
          .send(favorite)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Token needed to access resources');
            done();
          });
      });
    });

    context('with invalid property id sent', () => {
      it('returns a validation error', (done) => {
        request()
          .post('/api/v1/user/remove-favorite')
          .set('authorization', userToken)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Validation Error');
            done();
          });
      });
    });

    context('when removePropertyFromFavorites service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(User, 'findByIdAndUpdate').throws(new Error('Type Error'));
        request()
          .post('/api/v1/user/remove-favorite')
          .set('authorization', userToken)
          .send(favorite)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            User.findByIdAndUpdate.restore();
          });
      });
    });
  });

  describe('Upload User Profile', () => {
    let token;
    const user = UserFactory.build();

    beforeEach(async () => {
      token = await addUser(user);
      sinon.stub(Upload, 'uploadImage').callsFake((req, res, next) => {
        req.body = { title: 'testing' };
        req.files = { filename: 'test', url: 'urltest' };
        return next();
      });
    });

    context('with valid token', () => {
      it('returns an updated image profile', (done) => {
        request()
          .post('/api/v1/user/profile-image')
          .set('authorization', token)
          .set('Content-type', 'application/x-www-form-urlendcoded')
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            done();
          });
      });
    });
  });

  describe('Account Overview', () => {
    let token;
    const userId = mongoose.Types.ObjectId();
    const vendorId = mongoose.Types.ObjectId();
    const propertyId = mongoose.Types.ObjectId();
    const offerId = mongoose.Types.ObjectId();
    const transactionId = mongoose.Types.ObjectId();
    const user = UserFactory.build({ _id: userId });
    const vendor = UserFactory.build({ _id: vendorId });
    const property = PropertyFactory.build({
      _id: propertyId,
      addedBy: vendorId,
      updatedBy: vendorId,
      price: 20000000,
    });
    const referralId = mongoose.Types.ObjectId();
    const referral = ReferralFactory.build({
      _id: referralId,
      referrerId: userId,
      reward: { amount: 50000 },
    });

    const enquiryId = mongoose.Types.ObjectId();
    const enquiry = EnquiryFactory.build({ _id: enquiryId, userId, propertyId });
    const offer = OfferFactory.build({
      _id: offerId,
      enquiryId,
      vendorId,
      userId,
      totalAmountPayable: 19000000,
      status: OFFER_STATUS.ALLOCATED,
    });
    const transaction = TransactionFactory.build({
      _id: transactionId,
      propertyId,
      userId,
      adminId: vendorId,
      amount: 250000,
    });

    beforeEach(async () => {
      token = await addUser(user);
      await addUser(vendor);
    });

    context('with valid token', () => {
      it('returns contribution reward of zero', (done) => {
        request()
          .get('/api/v1/user/account-overview')
          .set('authorization', token)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.accountOverview.contributionReward).to.be.eql(0);
            expect(res.body.accountOverview.totalAmountPaid).to.be.eql(0);
            expect(res.body.accountOverview.referralRewards).to.be.eql(0);
            expect(res.body.accountOverview.properties.length).to.be.eql(0);
            done();
          });
      });
    });

    describe('when offer has been accepted', () => {
      beforeEach(async () => {
        await addReferral(referral);
        await addProperty(property);
        await addEnquiry(enquiry);
        await createOffer(offer);
        await addTransaction(transaction);
        await acceptOffer({ userId, offerId, signature: 'https://ballers.ng/signature.png' });
        await assignOffer(offerId);
      });

      context('with valid token', () => {
        it('returns a valid contribution reward', (done) => {
          request()
            .get('/api/v1/user/account-overview')
            .set('authorization', token)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.accountOverview.contributionReward).to.be.eql(
                property.price - offer.totalAmountPayable,
              );
              expect(res.body.accountOverview.totalAmountPaid).to.be.eql(transaction.amount);
              expect(res.body.accountOverview.referralRewards).to.be.eql(referral.reward.amount);
              expect(res.body.accountOverview.properties.length).to.be.eql(1);
              expect(res.body.accountOverview.properties[0].property._id).to.be.eql(
                propertyId.toString(),
              );
              done();
            });
        });
      });

      context('with no token', () => {
        it('returns a forbidden error', (done) => {
          request()
            .get('/api/v1/user/account-overview')
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Token needed to access resources');
              done();
            });
        });
      });

      context('with invalid token', () => {
        it('returns an authorization error', (done) => {
          request()
            .get('/api/v1/user/account-overview')
            .set('authorization', 'invalid-token')
            .end((err, res) => {
              expect(res).to.have.status(401);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Authentication Failed');
              done();
            });
        });
      });
    });
  });
});
