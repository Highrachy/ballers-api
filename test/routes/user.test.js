import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { expect, request } from '../config';

let mongoServer;
const opts = { useUnifiedTopology: true, useNewUrlParser: true };

before(async () => {
  mongoServer = new MongoMemoryServer();
  const mongoUri = await mongoServer.getUri();
  await mongoose.connect(mongoUri, opts);
});

after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

const validUser = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'johndoe@mail.com',
  password: 'johndoe',
  confirmPassword: 'johndoe',
  phone: '08012345678',
};

const invalidUser = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'johndoe@mail.com',
  password: 'johndoe',
  confirmPassword: 'notjohndoe',
  phone: '08012345678',
};

describe('User Route', () => {
  it('Mismatched passwords should return error', (done) => {
    request()
      .post('/api/v1/user/register')
      .send(invalidUser)
      .end((err, res) => {
        expect(res).to.be.an('object');
        expect(res).to.have.status(200);
        expect(res.body)
          .to.have.property('success')
          .eql(false);
        expect(res.body)
          .to.have.property('message')
          .eql('Passwords should match');
        done();
      });
  });

  it('Registration should be successful', (done) => {
    request()
      .post('/api/v1/user/register')
      .send(validUser)
      .end((err, res) => {
        expect(res).to.be.an('object');
        expect(res).to.have.status(200);
        expect(res.body)
          .to.have.property('success')
          .eql(true);
        expect(res.body)
          .to.have.property('message')
          .eql('User registered');
        expect(res.body).to.have.property('token');
        done();
      });
  });

  it('Existing email should be unsuccessful', (done) => {
    request()
      .post('/api/v1/user/register')
      .send(validUser)
      .end((err, res) => {
        expect(res).to.be.an('object');
        expect(res).to.have.status(200);
        expect(res.body)
          .to.have.property('success')
          .eql(false);
        expect(res.body)
          .to.have.property('message')
          .eql('Email is linked to another account');
        done();
      });
  });
});
