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
  loginUser,
  comparePassword,
  activateUser,
  forgotPasswordToken,
  resetPasswordViaToken,
  updateUser,
  getUserByReferralCode,
  generateReferralCode,
  generateCode,
  assignPropertyToUser,
  getAllRegisteredUsers,
  addPropertyToFavorites,
  removePropertyFromFavorites,
  getAccountOverview,
} from '../../server/services/user.service';
import UserFactory from '../factories/user.factory';
import { USER_SECRET } from '../../server/config';
import User from '../../server/models/user.model';
import Property from '../../server/models/property.model';
import PropertyFactory from '../factories/property.factory';
import { addProperty, updateProperty } from '../../server/services/property.service';
import OfferFactory from '../factories/offer.factory';
import EnquiryFactory from '../factories/enquiry.factory';
import { addEnquiry } from '../../server/services/enquiry.service';
import { createOffer } from '../../server/services/offer.service';

useDatabase();

const expectsReturnedTokenToBeValid = (token, id) => {
  const decodedToken = jwt.verify(token, USER_SECRET);
  const castedId = new mongoose.mongo.ObjectId(decodedToken.id);
  expect(castedId).to.deep.equal(id);
};

describe('User Service', () => {
  describe('#hashPassword', () => {
    it('should return a hashed password', async () => {
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

  describe('#comparePassword', () => {
    it('should return a hashed password', async () => {
      const password = 'my_password';
      const hash = await hashPassword(password);
      const comparison = await comparePassword(password, hash);
      expect(comparison).to.eql(true);
    });

    context('when compare password fails', () => {
      it('throws an error', async () => {
        const expectedError = new Error('sample error');
        sinon.stub(bcrypt, 'compare').throws(expectedError);

        const password = 'my_password';
        const hash = await hashPassword(password);
        try {
          await comparePassword(password, hash);
        } catch (err) {
          sinon.assert.threw(bcrypt.compare, expectedError);
        }

        bcrypt.compare.restore();
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
    });

    context('when a valid user is entered', () => {
      beforeEach(async () => {
        await addUser(user);
      });

      it('adds a new user', async () => {
        const currentCountedUsers = await User.countDocuments({});
        expect(currentCountedUsers).to.eql(countedUsers + 1);
      });

      it('returns the user token', async () => {
        const _id = mongoose.Types.ObjectId();
        const token = await addUser(UserFactory.build({ _id }));
        expectsReturnedTokenToBeValid(token, _id);
      });
    });

    context('when an existing user is entered', () => {
      it('throws an error', async () => {
        try {
          await addUser(user);
          await addUser(user);
        } catch (err) {
          const currentCountedUsers = await User.countDocuments({});
          expect(err.statusCode).to.eql(412);
          expect(err.error).to.be.eql('Email is linked to another account');
          expect(err.message).to.be.eql('Email is linked to another account');
          expect(currentCountedUsers).to.eql(countedUsers + 1);
        }
      });
    });

    context('when an invalid data is entered', () => {
      it('throws an error', async () => {
        try {
          const InvalidUser = UserFactory.build({ firstName: '' });
          await addUser(InvalidUser);
        } catch (err) {
          const currentCountedUsers = await User.countDocuments({});
          expect(err.statusCode).to.eql(400);
          expect(err.error.name).to.be.eql('ValidationError');
          expect(err.message).to.be.eql('Error adding user');
          expect(currentCountedUsers).to.eql(countedUsers);
        }
      });
    });

    context('when user is invited by by valid referral code', () => {
      const referralCode = 'RC1234';
      const userWithRef = UserFactory.build({ email, referralCode });
      beforeEach(async () => {
        await User.create(userWithRef);
      });

      it('returns the user token', async () => {
        const currentCountedUsers = await User.countDocuments({});
        const _id = mongoose.Types.ObjectId();
        const token = await addUser(UserFactory.build({ _id, referralCode }));
        expectsReturnedTokenToBeValid(token, _id);
        expect(currentCountedUsers).to.eql(countedUsers + 1);
      });
    });

    context('when an invalid invalid referal code is sent', () => {
      it('throws an error', async () => {
        try {
          const InvalidUser = UserFactory.build({ referralCode: '123456' });
          await addUser(InvalidUser);
        } catch (err) {
          const currentCountedUsers = await User.countDocuments({});
          expect(err.statusCode).to.eql(412);
          expect(err.message).to.be.eql('Invalid referral code');
          expect(currentCountedUsers).to.eql(countedUsers);
        }
      });
    });

    context('when getUserbyEmail returns an error', () => {
      it('throws an error', async () => {
        sinon.stub(User, 'findOne').throws(new Error('error msg'));
        try {
          await addUser(user);
        } catch (err) {
          const currentCountedUsers = await User.countDocuments({});
          expect(err.statusCode).to.eql(500);
          expect(err.error).to.be.an('Error');
          expect(err.message).to.be.eql('Internal Server Error');
          expect(currentCountedUsers).to.eql(countedUsers);
        }
        User.findOne.restore();
      });
    });

    context('when generateReferralCode returns an error', () => {
      it('throws an error', async () => {
        sinon.stub(User, 'findOne').throws(new Error('error msg'));

        try {
          await addUser(user);
        } catch (err) {
          const currentCountedUsers = await User.countDocuments({});
          expect(err.statusCode).to.eql(500);
          expect(err.error).to.be.an('Error');
          expect(err.message).to.be.eql('Internal Server Error');
          expect(currentCountedUsers).to.eql(countedUsers);
        }
        User.findOne.restore();
      });
    });
  });

  describe('#loginUser', () => {
    const userDetails = { email: 'myemail@mail.com', password: '123456' };
    const user = UserFactory.build(userDetails);
    beforeEach(async () => {
      await addUser(user);
    });

    context('when a valid user is entered', () => {
      it('comparePassword should return true', async () => {
        const hash = (await getUserByEmail(userDetails.email, '+password')).password;
        const compareResponse = await comparePassword(userDetails.password, hash);
        expect(compareResponse).to.eql(true);
      });
    });

    context('when the User model returns an error', () => {
      it('throws an error', async () => {
        sinon.stub(User, 'findOne').throws(new Error('error msg'));
        try {
          await loginUser(userDetails);
        } catch (err) {
          expect(err.statusCode).to.eql(500);
          expect(err.error).to.be.an('Error');
          expect(err.message).to.be.eql('Internal Server Error');
        }
        User.findOne.restore();
      });
    });

    context('when an invalid data is entered', () => {
      it('throws an error', async () => {
        try {
          const InvalidUser = UserFactory.build({ email: '' });
          await loginUser(InvalidUser);
        } catch (err) {
          expect(err.statusCode).to.eql(401);
          expect(err.message).to.be.eql('Invalid email or password');
        }
      });
      it('throws an error', async () => {
        try {
          const invalidDetails = UserFactory.build({
            email: 'myemail@mail.com',
            password: '654321',
          });
          await loginUser(invalidDetails);
        } catch (err) {
          expect(err.statusCode).to.eql(401);
          expect(err.message).to.be.eql('Invalid email or password');
        }
      });
    });
  });

  describe('#activateUser', () => {
    context('when a valid token', () => {
      const user = UserFactory.build({ activated: false });
      it('activates the user account', async () => {
        const token = await addUser(user);
        const activatedUser = await activateUser(token);
        expect(activatedUser.activated).to.eql(true);
        expect(activatedUser).to.have.property('activationDate');
      });
    });

    context('when an invalid token', () => {
      it('activates the user account', async () => {
        const user = UserFactory.build({ activated: false });
        const token = await addUser(user);
        try {
          await activateUser(`${token}1234567`);
        } catch (err) {
          expect(err.statusCode).to.eql(404);
          expect(err.message).to.eql('User not found');
        }
      });
    });

    context('when no token is given', () => {
      it('activates the user account', async () => {
        const user = UserFactory.build({ activated: false });
        await addUser(user);
        try {
          await activateUser('');
        } catch (err) {
          expect(err.statusCode).to.eql(404);
          expect(err.message).to.eql('User not found');
        }
      });
    });
  });

  describe('#forgotPasswordToken', () => {
    const email = 'myemail@mail.com';
    const generatedToken = 'generated token';
    const user = UserFactory.build({ email });

    before(() => {
      sinon.stub(jwt, 'sign').returns(generatedToken);
    });

    after(() => {
      jwt.sign.restore();
    });

    context('when a valid user is request for forgot password token', () => {
      beforeEach(async () => {
        await addUser(user);
      });

      it('returns the user token', async () => {
        const response = await forgotPasswordToken(email);
        expect(response.token).be.eql(generatedToken);
        expect(response.user.firstName).be.eql(user.firstName);
        expect(response.user.email).be.eql(user.email);
      });
    });

    context('when user cannot be found', () => {
      it('returns an error', async () => {
        try {
          await forgotPasswordToken(email);
        } catch (err) {
          expect(err.statusCode).to.eql(404);
          expect(err.error).to.be.eql('Your email address is not found.');
          expect(err.message).to.be.eql('Your email address is not found.');
        }
      });
    });

    context('when the User model returns an error', () => {
      it('throws an error', async () => {
        sinon.stub(User, 'findOne').throws(new Error('error msg'));
        try {
          await forgotPasswordToken(email);
        } catch (err) {
          expect(err.statusCode).to.eql(500);
          expect(err.error).to.be.an('Error');
          expect(err.message).to.be.eql('Internal Server Error');
        }
        User.findOne.restore();
      });
    });
  });

  describe('#resetPasswordViaToken', () => {
    const user = UserFactory.build();
    const oldPassword = user.password;

    context('when a valid user is request for forgot password token', () => {
      it('returns the user token', async () => {
        const token = await addUser(user);
        const newPassword = `${oldPassword}123#`;
        const response = await resetPasswordViaToken(newPassword, token);
        expect(response.firstName).be.eql(user.firstName);
        expect(response.email).be.eql(user.email);
      });
    });

    context('with invalid token', () => {
      it('throws an error', async () => {
        try {
          await resetPasswordViaToken(user.password, '123456');
        } catch (err) {
          expect(err.statusCode).to.eql(404);
          expect(err.message).to.be.eql('User not found');
        }
      });
    });
  });

  describe('#updateUser', () => {
    const _id = mongoose.Types.ObjectId();
    const updatedDetails = {
      id: _id,
      firstName: 'Updated firstname',
      lastName: 'Updated lastname',
      phone: '08012345678',
      referralCode: 'abc123',
      phone2: '08012345678',
      address: {
        street1: '123 sesame street',
        city: 'Epe',
        state: 'Lagos',
        country: 'Nigeria',
      },
    };

    beforeEach(async () => {
      await User.create(UserFactory.build({ _id }));
    });

    context('when all is valid', () => {
      it('returns a valid updated user', async () => {
        const updatedUser = await updateUser(updatedDetails);
        expect(updatedDetails.firstName).to.eql(updatedUser.firstName);
        expect(updatedDetails.lastName).to.eql(updatedUser.lastName);
        expect(updatedDetails.phone).to.eql(updatedUser.phone);
        expect(updatedDetails.address.street1).to.eql(updatedUser.address.street1);
      });
    });

    context('when findOneAndUpdate fails', () => {
      it('throws an error', async () => {
        sinon.stub(User, 'findOneAndUpdate').throws(new Error('error msg'));

        try {
          await updateUser(updatedDetails);
        } catch (err) {
          expect(err.statusCode).to.eql(400);
          expect(err.error.message).to.be.eql('error msg');
          expect(err.message).to.be.eql('Error updating user');
        }
        User.findOneAndUpdate.restore();
      });
    });
  });

  describe('#getUserByReferralCode', () => {
    const referralCode = 'abc123';
    before(async () => {
      await User.create(UserFactory.build({ referralCode }));
    });

    it('returns a valid user by referralCode', async () => {
      const user = await getUserByReferralCode(referralCode);
      expect(user.referralCode).to.eql(referralCode);
    });
  });

  describe('#generateReferralCode', () => {
    const referralCode = 'abc123';
    before(async () => {
      await User.create(UserFactory.build({ referralCode }));
    });

    context('when getUserByReferralCode returns an error', () => {
      it('throws an error', async () => {
        sinon.stub(User, 'findOne').throws(new Error('error msg'));

        try {
          await generateReferralCode(referralCode);
        } catch (err) {
          expect(err.statusCode).to.eql(500);
          expect(err.error).to.be.an('Error');
          expect(err.message).to.be.eql('Internal Server Error');
        }
        User.findOne.restore();
      });
    });
  });

  describe('#generateCode', () => {
    context('when firstname is longer than 2 characters', () => {
      it('returns 6 digit code starting with first two letters of name', () => {
        const code = generateCode('abc');
        expect(code).to.have.lengthOf(6);
        expect(code.substring(0, 2)).to.have.string('ab');
      });
    });

    context('when firstname is equal to 2 characters', () => {
      it('returns 6 digit code starting with first two letters of name', () => {
        const code = generateCode('ab');
        expect(code).to.have.lengthOf(6);
        expect(code.substring(0, 2)).to.have.string('ab');
      });
    });

    context('when firstname is shorter than 2 characters', () => {
      it('returns 6 digit code starting with first letter of name', () => {
        const code = generateCode('a');
        expect(code).to.have.lengthOf(6);
        expect(code.substring(0, 1)).to.have.string('a');
      });
    });
  });

  describe('#assignPropertyToUser', () => {
    const _id = mongoose.Types.ObjectId();
    const propertyId = mongoose.Types.ObjectId();
    const toBeAssigned = {
      propertyId,
      userId: _id,
      assignedBy: _id,
    };

    describe('when property units is less than one', () => {
      beforeEach(async () => {
        await updateProperty({ id: propertyId, units: 0 });
      });
      context('when units are less than one', () => {
        it('returns no units available', async () => {
          try {
            await assignPropertyToUser(toBeAssigned);
          } catch (err) {
            expect(err.statusCode).to.eql(404);
            expect(err.message).to.be.eql('No available units');
          }
        });
      });
    });

    beforeEach(async () => {
      await User.create(UserFactory.build({ _id }));
      await Property.create(
        PropertyFactory.build({ _id: propertyId, addedBy: _id, updatedBy: _id }),
      );
    });

    context('when getUserById works', () => {
      it('returns a valid updated user', async () => {
        await assignPropertyToUser(toBeAssigned);
        const user = await getUserById(_id);
        expect(user.assignedProperties[0].propertyId).to.eql(propertyId);
      });
    });

    context('when getPropertyById fails', () => {
      it('throws an error', async () => {
        sinon.stub(Property, 'findById').throws(new Error('error msg'));

        try {
          await assignPropertyToUser(toBeAssigned);
        } catch (err) {
          expect(err.statusCode).to.eql(500);
          expect(err.error).to.be.an('Error');
          expect(err.message).to.be.eql('Internal Server Error');
        }
        Property.findById.restore();
      });
    });

    context('when getUserById fails', () => {
      it('throws an error', async () => {
        sinon.stub(User, 'findById').throws(new Error('error msg'));

        try {
          await assignPropertyToUser(toBeAssigned);
        } catch (err) {
          expect(err.statusCode).to.eql(500);
          expect(err.error).to.be.an('Error');
          expect(err.message).to.be.eql('Internal Server Error');
        }
        User.findById.restore();
      });
    });

    context('when findByIdAndUpdate fails', () => {
      it('throws an error', async () => {
        sinon.stub(Property, 'findByIdAndUpdate').throws(new Error('error msg'));

        try {
          await assignPropertyToUser(toBeAssigned);
        } catch (err) {
          expect(err.statusCode).to.eql(400);
          expect(err.error).to.be.an('Error');
          expect(err.message).to.be.eql('Error assigning property');
        }
        Property.findByIdAndUpdate.restore();
      });
    });
  });

  describe('#getAllRegisteredUsers', async () => {
    let countedUsers;

    beforeEach(async () => {
      await addUser(UserFactory.build());
      await addUser(UserFactory.build());
    });
    context('when user added is valid', async () => {
      it('returns total users', async () => {
        countedUsers = await User.countDocuments({});
        const users = await getAllRegisteredUsers();
        expect(users).to.be.an('array');
        expect(users.length).to.be.eql(countedUsers);
      });
    });
    context('when new user is added', async () => {
      before(async () => {
        await User.create(UserFactory.build());
      });
      it('returns total users plus one', async () => {
        const users = await getAllRegisteredUsers();
        expect(users).to.be.an('array');
        expect(users.length).to.be.eql(countedUsers + 1);
      });
    });
  });

  describe('#addPropertyToFavorites', () => {
    const _id = mongoose.Types.ObjectId();
    const propertyId = mongoose.Types.ObjectId();
    const favorite = {
      propertyId,
      userId: _id,
    };
    const invalidFavorite = {
      propertyId: mongoose.Types.ObjectId(),
      userId: _id,
    };

    describe('when property does not exist in db', () => {
      context('when property id does not exist in db', () => {
        it('returns no units available', async () => {
          try {
            await addPropertyToFavorites(invalidFavorite);
          } catch (err) {
            expect(err.statusCode).to.eql(404);
            expect(err.message).to.be.eql('Property not found');
          }
        });
      });
    });

    beforeEach(async () => {
      await User.create(UserFactory.build({ _id }));
      await Property.create(
        PropertyFactory.build({ _id: propertyId, addedBy: _id, updatedBy: _id }),
      );
    });

    context('when getUserById works', () => {
      it('returns a valid updated user', async () => {
        await addPropertyToFavorites(favorite);
        const user = await getUserById(_id);
        expect(user.favorites[0]).to.eql(propertyId);
      });
    });

    context('when getPropertyById fails', () => {
      it('throws an error', async () => {
        sinon.stub(Property, 'findById').throws(new Error('error msg'));

        try {
          await addPropertyToFavorites(favorite);
        } catch (err) {
          expect(err.statusCode).to.eql(500);
          expect(err.error).to.be.an('Error');
          expect(err.message).to.be.eql('Internal Server Error');
        }
        Property.findById.restore();
      });
    });

    context('when findByIdAndUpdate fails', () => {
      it('throws an error', async () => {
        sinon.stub(User, 'findByIdAndUpdate').throws(new Error('error msg'));

        try {
          await addPropertyToFavorites(favorite);
        } catch (err) {
          expect(err.statusCode).to.eql(400);
          expect(err.error).to.be.an('Error');
          expect(err.message).to.be.eql('Error adding property to favorites');
        }
        User.findByIdAndUpdate.restore();
      });
    });
  });

  describe('#removePropertyFromFavorites', () => {
    const _id = mongoose.Types.ObjectId();
    const propertyId = mongoose.Types.ObjectId();
    const favorite = {
      propertyId,
      userId: _id,
    };

    beforeEach(async () => {
      await User.create(UserFactory.build({ _id }));
      await Property.create(
        PropertyFactory.build({ _id: propertyId, addedBy: _id, updatedBy: _id }),
      );
    });

    context('when findByIdAndUpdate works', () => {
      it('returns a valid updated user', async () => {
        await removePropertyFromFavorites(favorite);
        const user = await getUserById(_id);
        expect(user.favorites.length).to.be.eql(0);
      });
    });

    context('when findByIdAndUpdate fails', () => {
      it('throws an error', async () => {
        sinon.stub(User, 'findByIdAndUpdate').throws(new Error('error msg'));

        try {
          await removePropertyFromFavorites(favorite);
        } catch (err) {
          expect(err.statusCode).to.eql(400);
          expect(err.error).to.be.an('Error');
          expect(err.message).to.be.eql('Error removing property from favorites');
        }
        User.findByIdAndUpdate.restore();
      });
    });
  });

  describe('#getAccountOverview', () => {
    const userId = mongoose.Types.ObjectId();
    const vendorId = mongoose.Types.ObjectId();
    const propertyId = mongoose.Types.ObjectId();
    const user = UserFactory.build({ _id: userId });
    const vendor = UserFactory.build({ _id: vendorId });
    const property = PropertyFactory.build({
      _id: propertyId,
      addedBy: vendorId,
      updatedBy: vendorId,
      price: 20000000,
    });

    const enquiryId = mongoose.Types.ObjectId();
    const enquiry = EnquiryFactory.build({ _id: enquiryId, userId, propertyId });
    const offer = OfferFactory.build({
      enquiryId,
      vendorId,
      userId,
      totalAmountPayable: 18000000,
    });

    beforeEach(async () => {
      await addUser(user);
      await addUser(vendor);
    });
    context('when account has no contribution rewards', () => {
      it('returns zero as account overview', async () => {
        const overview = await getAccountOverview(userId);
        expect(overview.contributionReward).to.eql(0);
      });
    });

    context('when account has two million off property price in offer letter', () => {
      beforeEach(async () => {
        await addProperty(property);
        await addEnquiry(enquiry);
        await createOffer(offer);
      });

      it('returns two million account overview', async () => {
        const overview = await getAccountOverview(userId);
        expect(overview.contributionReward).to.eql(2000000);
      });
    });
  });
});
