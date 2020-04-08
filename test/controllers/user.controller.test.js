import { expect, request, useDatabase } from '../config';
import User from '../../server/models/user.model';
import { addUser } from '../../server/services/user.service';
import UserFactory from '../factories/user.factory';

useDatabase();

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
          done();
        });
    });
  });
});

describe('Login Route', () => {
  context('with valid data', () => {
    const userLogin = { email: 'myemail@mail.com', password: '123456' };
    const user = UserFactory.build(userLogin);
    before(async () => {
      await addUser(user);
    });
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
          done();
        });
    });
  });
  context('with empty email', () => {
    const userLogin = { email: '', password: '123456' };
    it('returns error', (done) => {
      request()
        .post('/api/v1/user/login')
        .send(userLogin)
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
    const userLogin = { email: 'myemail@mail.com', password: '' };
    it('returns error', (done) => {
      request()
        .post('/api/v1/user/login')
        .send(userLogin)
        .end((err, res) => {
          expect(res).to.have.status(412);
          expect(res.body.success).to.be.eql(false);
          expect(res.body.message).to.be.eql('Validation Error');
          expect(res.body.error).to.be.eql('"Password" is not allowed to be empty');
          done();
        });
    });
  });
});
