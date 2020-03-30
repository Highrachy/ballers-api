import { expect, request, useDatabase } from '../config';
import User from '../factories/user.factory';

useDatabase();

describe('Register Route', () => {
  context('with valid data', () => {
    it('returns successful token', (done) => {
      const user = User.build({ email: 'myemail@mail.com' });
      request()
        .post('/api/v1/user/register')
        .send(user)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.success).to.be.eql(true);
          expect(res.body.message).to.be.eql('User registered');
          expect(res.body).to.have.property('token');
          done();
        });
    });

    it('returns error for an existing email', (done) => {
      const user = User.build({ email: 'myemail@mail.com' });
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
        const user = User.build({ firstName: '' });
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
        const user = User.build({ lastName: '' });
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
        const user = User.build({ email: '' });
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
        const user = User.build({ email: 'wrong-email' });
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
        const user = User.build({ password: '' });
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
        const user = User.build({ password: '123' });
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
        const user = User.build({ confirmPassword: '' });
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
        const user = User.build({ password: '123456', confirmPassword: '000000' });
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
      const user = User.build({ phone: '' });
      request()
        .post('/api/v1/user/register')
        .send(user)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.success).to.be.eql(true);
          expect(res.body.message).to.be.eql('User registered');
          expect(res.body).to.have.property('token');
          done();
        });
    });
  });

  context('when phone number is not given', () => {
    it('returns an error', (done) => {
      const user = User.build();
      delete user.phone;
      request()
        .post('/api/v1/user/register')
        .send(user)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.success).to.be.eql(true);
          expect(res.body.message).to.be.eql('User registered');
          expect(res.body).to.have.property('token');
          done();
        });
    });
  });
});
