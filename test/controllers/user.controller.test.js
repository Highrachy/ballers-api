import bcrypt from 'bcryptjs';
import { expect, request, sinon, useDatabase } from '../config';
import User from '../../server/models/user.model';
import { addUser } from '../../server/services/user.service';
import UserFactory from '../factories/user.factory';
import * as MailService from '../../server/services/mailer.service';
import EMAIL_CONTENT from '../../mailer';

useDatabase();

let sendMailSpy;
const sandbox = sinon.createSandbox();
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
          done();
        });
    });
  });

  context('with an invalid token', () => {
    it('returns successful payload', (done) => {
      request()
        .get(`/api/v1/user/activate?token=${token}123456`)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body.success).to.be.eql(false);
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
          expect(res.body.error).to.be.eql('"Password" length must be at least 6 characters long');
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
          expect(res.body.message).to.be.eql('User not found');
          done();
        });
    });
  });
});

describe('Update User', () => {
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
          expect(res.body).to.have.property('updateduser');
          expect(res.body.updateduser.firstName).to.be.eql(newUser.firstName);
          expect(res.body.updateduser.lastName).to.be.eql(newUser.lastName);
          expect(res.body.updateduser.phone).to.be.eql(newUser.phone);
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
      sinon.stub(User, 'findByIdAndUpdate').throws(new Error('Type Error'));
      request()
        .put('/api/v1/user/update')
        .set('authorization', token)
        .send(newUser)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body.success).to.be.eql(false);
          done();
          User.findByIdAndUpdate.restore();
        });
    });
  });
});
