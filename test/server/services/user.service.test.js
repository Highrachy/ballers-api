import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { expect, sinon, useDatabase } from '../config';
import {
  hashPassword,
  getUserByEmail,
  getUserById,
  generateToken,
  addUser,
} from '../../../server/services/user.service';
import UserFactory from '../factories/user.factory';
import { USER_SECRET } from '../../../server/config/config';
import User from '../../../server/models/user.model';

useDatabase();

describe('User Service', () => {
  describe('#hashPassword', () => {
    it('should return a hashed password asynchronously', async () => {
      const password = 'my_password';
      const hash = await hashPassword(password);
      expect(hash).to.length(60);
      expect(hash).to.not.eql(password);
    });

    context('when genSalt fails', () => {
      it('throws an error', async () => {
        const expectedError = new Error('sample error');
        sinon.stub(bcrypt, 'genSalt').throws(expectedError);

        const password = 'my_password';
        try {
          await hashPassword(password);
        } catch (err) {
          sinon.assert.threw(bcrypt.genSalt, expectedError);
        }

        bcrypt.genSalt.restore();
      });
    });

    context('when hashing fails', () => {
      it('throws an error', async () => {
        const expectedError = new Error('sample error');
        sinon.stub(bcrypt, 'hash').throws(expectedError);

        const password = 'my_password';
        try {
          await hashPassword(password);
        } catch (err) {
          sinon.assert.threw(bcrypt.hash, expectedError);
        }

        bcrypt.hash.restore();
      });
    });
  });

  describe('#getUserByEmail', () => {
    const email = 'myemail@mail.com';
    before(async () => {
      await User.create(UserFactory.build({ email }));
    });

    it('returns a valid user by email', async () => {
      const user = await getUserByEmail(email);
      expect(user.email).to.eql(email);
    });
  });

  describe('#getUserById', () => {
    const _id = mongoose.Types.ObjectId();
    before(async () => {
      await User.create(UserFactory.build({ _id }));
    });

    it('returns a valid user by Id', async () => {
      const user = await getUserById(_id);
      expect(user._id).to.eql(_id);
    });
  });

  describe('#generateToken', () => {
    it('generates a valid token', () => {
      const _id = mongoose.Types.ObjectId();
      const token = generateToken(_id);
      const decodedToken = jwt.verify(token, USER_SECRET);
      const castedId = new mongoose.mongo.ObjectId(decodedToken.id);
      expect(castedId).to.deep.equal(_id);
    });
  });

  describe('#addUser', () => {
    let countedUsers;
    const email = 'myemail@mail.com';
    const user = UserFactory.build({ email });

    beforeEach(async () => {
      countedUsers = await User.countDocuments({});
      await addUser(user);
    });

    it('adds a new user', async () => {
      const currentCountedUsers = await User.countDocuments({});
      expect(currentCountedUsers).to.eql(countedUsers + 1);
    });

    it('returns the user token', async () => {
      const _id = mongoose.Types.ObjectId();
      const token = await addUser(UserFactory.build({ _id }));
      const decodedToken = jwt.verify(token, USER_SECRET);
      const castedId = new mongoose.mongo.ObjectId(decodedToken.id);
      expect(castedId).to.deep.equal(_id);
    });

    it('throws an error', async () => {
      try {
        await addUser(user);
      } catch (err) {
        const currentCountedUsers = await User.countDocuments({});
        expect(err.statusCode).to.eql(412);
        expect(err.error).to.be.eql('Email is linked to another account');
        expect(err.message).to.be.eql('Email is linked to another account');
        expect(currentCountedUsers).to.eql(countedUsers + 1);
      }
    });

    it('throws an error', async () => {
      try {
        const InvalidUser = UserFactory.build({ firstName: '' });
        await addUser(InvalidUser);
      } catch (err) {
        const currentCountedUsers = await User.countDocuments({});
        expect(err.statusCode).to.eql(400);
        expect(err.error.name).to.be.eql('ValidationError');
        expect(err.message).to.be.eql('Error adding user');
        expect(currentCountedUsers).to.eql(countedUsers + 1);
      }
    });

    context('when getUserbyEmail returns an error', () => {
      it('throws an error', async () => {
        sinon.stub(User, 'findOne').rejects();

        try {
          await addUser(user);
        } catch (err) {
          const currentCountedUsers = await User.countDocuments({});
          expect(err.statusCode).to.eql(500);
          expect(err.error).to.be.an('Error');
          expect(err.message).to.be.eql('Internal Server Error');
          expect(currentCountedUsers).to.eql(countedUsers + 1);
        }

        User.findOne.restore();
      });
    });
  });
});
