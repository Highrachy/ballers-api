import mongoose from 'mongoose';
import { expect, request, sinon, useDatabase } from '../config';
import Property from '../../server/models/property.model';
import User from '../../server/models/user.model';
import Transaction from '../../server/models/transaction.model';
import Offer from '../../server/models/offer.model';
import PropertyFactory from '../factories/property.factory';
import UserFactory from '../factories/user.factory';
import { addUser, assignPropertyToUser } from '../../server/services/user.service';
import OfferFactory from '../factories/offer.factory';
import EnquiryFactory from '../factories/enquiry.factory';
import TransactionFactory from '../factories/transaction.factory';
import { addProperty } from '../../server/services/property.service';
import { createOffer } from '../../server/services/offer.service';
import { addEnquiry } from '../../server/services/enquiry.service';
import { addTransaction } from '../../server/services/transaction.service';
import { OFFER_STATUS, USER_ROLE } from '../../server/helpers/constants';
import Enquiry from '../../server/models/enquiry.model';
import { itReturnsErrorForUnverifiedVendor } from '../helpers';

useDatabase();

let adminToken;
let vendorToken;
let userToken;
let invalidVendorToken;

const adminUser = UserFactory.build(
  { role: USER_ROLE.ADMIN, activated: true },
  { generateId: true },
);
const vendorUser = UserFactory.build(
  {
    role: USER_ROLE.VENDOR,
    activated: true,
    vendor: {
      verified: true,
    },
  },
  { generateId: true },
);
const invalidVendorUser = UserFactory.build(
  {
    role: USER_ROLE.VENDOR,
    activated: true,
    vendor: {
      verified: true,
    },
  },
  { generateId: true },
);
const regularUser = UserFactory.build(
  { role: USER_ROLE.USER, activated: true },
  { generateId: true },
);

describe('Property Controller', () => {
  beforeEach(async () => {
    adminToken = await addUser(adminUser);
    vendorToken = await addUser(vendorUser);
    invalidVendorToken = await addUser(invalidVendorUser);
    userToken = await addUser(regularUser);
  });

  describe('Add Property Route', () => {
    const endpoint = '/api/v1/property/add';
    const method = 'post';
    context('with valid data', () => {
      it('returns successful property', (done) => {
        const property = PropertyFactory.build();
        request()
          .post('/api/v1/property/add')
          .set('authorization', vendorToken)
          .send(property)
          .end((err, res) => {
            expect(res).to.have.status(201);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Property added');
            expect(res.body).to.have.property('property');
            done();
          });
      });
    });

    itReturnsErrorForUnverifiedVendor({
      endpoint,
      method,
      user: vendorUser,
      useExistingUser: true,
    });

    context('with unauthorized user access token', () => {
      [...new Array(2)].map((_, index) =>
        it('returns forbidden', (done) => {
          const property = PropertyFactory.build();
          request()
            .post('/api/v1/property/add')
            .set('authorization', [userToken, adminToken][index])
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('You are not permitted to perform this action');
              done();
            });
        }),
      );
    });

    context('when token is used', () => {
      beforeEach(async () => {
        await User.findByIdAndDelete(vendorUser._id);
      });
      it('returns token error', (done) => {
        const property = PropertyFactory.build();
        request()
          .post('/api/v1/property/add')
          .set('authorization', vendorToken)
          .send(property)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Invalid token');
            done();
          });
      });
    });

    context('with invalid data', () => {
      context('when name is empty', () => {
        it('returns an error', (done) => {
          const property = PropertyFactory.build({ name: '' });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property name" is not allowed to be empty');
              done();
            });
        });
      });
      context('when title document is empty', () => {
        it('returns successful property', (done) => {
          const property = PropertyFactory.build({ titleDocument: '' });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql(
                '"Property title document" is not allowed to be empty',
              );
              done();
            });
        });
      });
      context('when street1 is empty', () => {
        it('returns an error', (done) => {
          const property = PropertyFactory.build({
            address: {
              street1: '',
              street2: 'miracle street',
              city: 'ilorin',
              state: 'kwara',
              country: 'nigeria',
            },
          });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Street 1" is not allowed to be empty');
              done();
            });
        });
      });
      context('when street2 is empty', () => {
        it('returns an error', (done) => {
          const property = PropertyFactory.build({
            address: {
              street1: 'sesame street',
              street2: '',
              city: 'ilorin',
              state: 'kwara',
              country: 'nigeria',
            },
          });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(201);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Property added');
              expect(res.body).to.have.property('property');
              done();
            });
        });
      });
      context('when city is empty', () => {
        it('returns an error', (done) => {
          const property = PropertyFactory.build({
            address: {
              street1: 'sesame street',
              street2: 'miracle street',
              city: '',
              state: 'kwara',
              country: 'nigeria',
            },
          });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"City" is not allowed to be empty');
              done();
            });
        });
      });
      context('when state is empty', () => {
        it('returns an error', (done) => {
          const property = PropertyFactory.build({
            address: {
              street1: 'sesame street',
              street2: 'miracle street',
              city: 'ilorin',
              state: '',
              country: 'nigeria',
            },
          });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"State" is not allowed to be empty');
              done();
            });
        });
      });
      context('when country is empty', () => {
        it('returns an error', (done) => {
          const property = PropertyFactory.build({
            address: {
              street1: 'sesame street',
              street2: 'miracle street',
              city: 'ilorin',
              state: 'kwara',
              country: '',
            },
          });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Country" is not allowed to be empty');
              done();
            });
        });
      });
      context('when price is empty', () => {
        it('returns an error', (done) => {
          const property = PropertyFactory.build({ price: '' });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property price" must be a number');
              done();
            });
        });
      });
      context('when units is empty', () => {
        it('returns an error', (done) => {
          const property = PropertyFactory.build({ units: '' });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property units" must be a number');
              done();
            });
        });
      });
      context('when houseType is empty', () => {
        it('returns an error', (done) => {
          const property = PropertyFactory.build({ houseType: '' });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property type" is not allowed to be empty');
              done();
            });
        });
      });
      context('when bedrooms is empty', () => {
        it('returns an error', (done) => {
          const property = PropertyFactory.build({ bedrooms: '' });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Bedroom number" must be a number');
              done();
            });
        });
      });
      context('when toilets is empty', () => {
        it('returns an error', (done) => {
          const property = PropertyFactory.build({ toilets: '' });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Toilet number" must be a number');
              done();
            });
        });
      });
      context('when description is empty', () => {
        it('returns an error', (done) => {
          const property = PropertyFactory.build({ description: '' });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property description" is not allowed to be empty');
              done();
            });
        });
      });
      context('when floorPlans is empty', () => {
        it('returns an error', (done) => {
          const property = PropertyFactory.build({ floorPlans: '' });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property floor plans" is not allowed to be empty');
              done();
            });
        });
      });
      context('when neighborhood is empty', () => {
        it('returns an error', (done) => {
          const property = PropertyFactory.build({ neighborhood: '' });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property neighborhood" must be an array');
              done();
            });
        });
      });
      context('when neighborhood is an empty array', () => {
        it('returns successful property', (done) => {
          const property = PropertyFactory.build({ neighborhood: [] });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(201);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Property added');
              expect(res.body).to.have.property('property');
              done();
            });
        });
      });
      context('when mainImage is empty', () => {
        it('returns an error', (done) => {
          const property = PropertyFactory.build({ mainImage: '' });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property main image" is not allowed to be empty');
              done();
            });
        });
      });
      context('when gallery is empty', () => {
        it('returns an error', (done) => {
          const property = PropertyFactory.build({ gallery: '' });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property gallery" must be an array');
              done();
            });
        });
      });
      context('when gallery is empty array', () => {
        it('returns successful property', (done) => {
          const property = PropertyFactory.build({ gallery: [] });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(201);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Property added');
              expect(res.body).to.have.property('property');
              done();
            });
        });
      });
      context('when mapLocation.longitude is empty', () => {
        it('returns an error', (done) => {
          const property = PropertyFactory.build({ mapLocation: { longitude: '' } });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql(
                '"Map location longitude" is not allowed to be empty',
              );
              done();
            });
        });
      });
      context('when mapLocation.latitude is empty', () => {
        it('returns an error', (done) => {
          const property = PropertyFactory.build({ mapLocation: { latitude: '' } });
          request()
            .post('/api/v1/property/add')
            .set('authorization', vendorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql(
                '"Map location latitude" is not allowed to be empty',
              );
              done();
            });
        });
      });
    });
  });

  describe('Update Property', () => {
    const property = PropertyFactory.build(
      {
        addedBy: vendorUser._id,
        updatedBy: vendorUser._id,
      },
      { generateId: true },
    );
    const newProperty = {
      id: property._id,
      price: 30200000,
      units: 87,
    };

    beforeEach(async () => {
      await addProperty(property);
    });

    const endpoint = '/api/v1/property/update';
    const method = 'put';
    itReturnsErrorForUnverifiedVendor({
      endpoint,
      method,
      user: vendorUser,
      useExistingUser: true,
    });

    context('with valid data & token', () => {
      it('returns a updated property', (done) => {
        request()
          .put('/api/v1/property/update')
          .set('authorization', vendorToken)
          .send(newProperty)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body).to.have.property('property');
            expect(res.body.property.price).to.be.eql(newProperty.price);
            expect(res.body.property.units).to.be.eql(newProperty.units);
            done();
          });
      });
    });

    context('with vendor token of another vendor', () => {
      it('returns forbidden', (done) => {
        request()
          .put('/api/v1/property/update')
          .set('authorization', invalidVendorToken)
          .send(newProperty)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.error.message).to.be.eql(
              'You are not permitted to perform this action',
            );
            done();
          });
      });
    });

    context('with unauthorized user access token', () => {
      [...new Array(2)].map((_, index) =>
        it('returns forbidden', (done) => {
          request()
            .put('/api/v1/property/update')
            .set('authorization', [userToken, adminToken][index])
            .send(newProperty)
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('You are not permitted to perform this action');
              done();
            });
        }),
      );
    });

    context('without token', () => {
      it('returns error', (done) => {
        request()
          .put('/api/v1/property/update')
          .send(newProperty)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Token needed to access resources');
            done();
          });
      });
    });

    context('when user token is used', () => {
      beforeEach(async () => {
        await User.findByIdAndDelete(vendorUser._id);
      });
      it('returns token error', (done) => {
        request()
          .put('/api/v1/property/update')
          .set('authorization', vendorToken)
          .send(newProperty)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Invalid token');
            done();
          });
      });
    });

    context('with invalid property', () => {
      it('returns a updated user', (done) => {
        request()
          .put('/api/v1/property/update')
          .set('authorization', vendorToken)
          .send()
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
        sinon.stub(Property, 'findByIdAndUpdate').throws(new Error('Type Error'));
        request()
          .put('/api/v1/property/update')
          .set('authorization', vendorToken)
          .send(newProperty)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            Property.findByIdAndUpdate.restore();
          });
      });
    });

    context('with invalid data', () => {
      context('when name is empty', () => {
        it('returns an error', (done) => {
          const invalidProperty = PropertyFactory.build({ id: property._id, name: '' });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property name" is not allowed to be empty');
              done();
            });
        });
      });

      context('when address.street1 is empty', () => {
        it('returns an error', (done) => {
          const invalidProperty = PropertyFactory.build({
            id: property._id,
            address: { street1: '' },
          });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Street 1" is not allowed to be empty');
              done();
            });
        });
      });
      context('when address.street2 is empty', () => {
        it('returns an error', (done) => {
          const invalidProperty = PropertyFactory.build({
            id: property._id,
            address: { street2: '' },
          });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Street 2" is not allowed to be empty');
              done();
            });
        });
      });
      context('when address.city is empty', () => {
        it('returns an error', (done) => {
          const invalidProperty = PropertyFactory.build({
            id: property._id,
            address: { city: '' },
          });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"City" is not allowed to be empty');
              done();
            });
        });
      });
      context('when address.state is empty', () => {
        it('returns an error', (done) => {
          const invalidProperty = PropertyFactory.build({
            id: property._id,
            address: { state: '' },
          });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"State" is not allowed to be empty');
              done();
            });
        });
      });
      context('when address.country is empty', () => {
        it('returns an error', (done) => {
          const invalidProperty = PropertyFactory.build({
            id: property._id,
            address: { country: '' },
          });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Country" is not allowed to be empty');
              done();
            });
        });
      });
      context('when price is empty', () => {
        it('returns an error', (done) => {
          const invalidProperty = PropertyFactory.build({ id: property._id, price: '' });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property price" must be a number');
              done();
            });
        });
      });
      context('when units is empty', () => {
        it('returns an error', (done) => {
          const invalidProperty = PropertyFactory.build({ id: property._id, units: '' });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property units" must be a number');
              done();
            });
        });
      });
      context('when houseType is empty', () => {
        it('returns an error', (done) => {
          const invalidProperty = PropertyFactory.build({ id: property._id, houseType: '' });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property type" is not allowed to be empty');
              done();
            });
        });
      });
      context('when bedrooms is empty', () => {
        it('returns an error', (done) => {
          const invalidProperty = PropertyFactory.build({ id: property._id, bedrooms: '' });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Bedroom number" must be a number');
              done();
            });
        });
      });
      context('when toilets is empty', () => {
        it('returns an error', (done) => {
          const invalidProperty = PropertyFactory.build({ id: property._id, toilets: '' });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Toilet number" must be a number');
              done();
            });
        });
      });
      context('when description is empty', () => {
        it('returns an error', (done) => {
          const invalidProperty = PropertyFactory.build({ id: property._id, description: '' });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property description" is not allowed to be empty');
              done();
            });
        });
      });
      context('when floorPlans is empty', () => {
        it('returns an error', (done) => {
          const invalidProperty = PropertyFactory.build({ id: property._id, floorPlans: '' });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property floor plans" is not allowed to be empty');
              done();
            });
        });
      });
      context('when neighborhood is empty', () => {
        it('returns an error', (done) => {
          const invalidProperty = PropertyFactory.build({ id: property._id, neighborhood: '' });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property neighborhood" must be an array');
              done();
            });
        });
      });
      context('when neighborhood is empty array', () => {
        it('returns an error', (done) => {
          const invalidProperty = PropertyFactory.build({ id: property._id, neighborhood: [] });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('property');
              expect(res.body.property.neighborhood).to.be.eql(invalidProperty.neighborhood);
              done();
            });
        });
      });
      context('when mainImage is empty', () => {
        it('returns an error', (done) => {
          const invalidProperty = PropertyFactory.build({ id: property._id, mainImage: '' });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property main image" is not allowed to be empty');
              done();
            });
        });
      });
      context('when gallery is empty', () => {
        it('returns an error', (done) => {
          const invalidProperty = PropertyFactory.build({ id: property._id, gallery: '' });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property gallery" must be an array');
              done();
            });
        });
      });
      context('when gallery is empty array', () => {
        it('returns an error', (done) => {
          const invalidProperty = PropertyFactory.build({ id: property._id, gallery: [] });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('property');
              expect(res.body.property.neighborhood).to.be.eql(invalidProperty.neighborhood);
              done();
            });
        });
      });
      context('when mapLocation.longitude is empty', () => {
        it('returns an error', (done) => {
          const invalidProperty = PropertyFactory.build({
            id: property._id,
            mapLocation: { longitude: '' },
          });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql(
                '"Map location longitude" is not allowed to be empty',
              );
              done();
            });
        });
      });
      context('when mapLocation.latitude is empty', () => {
        it('returns an error', (done) => {
          const invalidProperty = PropertyFactory.build({
            id: property._id,
            mapLocation: { latitude: '' },
          });
          request()
            .put('/api/v1/property/update')
            .set('authorization', vendorToken)
            .send(invalidProperty)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql(
                '"Map location latitude" is not allowed to be empty',
              );
              done();
            });
        });
      });
    });
  });

  describe('Delete property', () => {
    const invalidPropertyId = mongoose.Types.ObjectId();
    const property = PropertyFactory.build(
      { addedBy: vendorUser._id, updatedBy: vendorUser._id },
      { generateId: true },
    );

    beforeEach(async () => {
      await addProperty(property);
    });

    context('with a valid token & id', () => {
      [...new Array(2)].map((_, index) =>
        it('successfully deletes property', (done) => {
          request()
            .delete(`/api/v1/property/delete/${property._id}`)
            .set('authorization', [vendorToken, adminToken][index])
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.message).to.be.eql('Property deleted');
              done();
            });
        }),
      );
    });

    context('with user access token', () => {
      it('returns forbidden', (done) => {
        request()
          .delete(`/api/v1/property/delete/${property._id}`)
          .set('authorization', userToken)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('You are not permitted to perform this action');
            done();
          });
      });
    });

    context('with invalid vendor access token', () => {
      it('returns forbidden', (done) => {
        request()
          .delete(`/api/v1/property/delete/${property._id}`)
          .set('authorization', invalidVendorToken)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.error.message).to.be.eql(
              'You are not permitted to perform this action',
            );
            done();
          });
      });
    });

    const endpoint = `/api/v1/property/delete/${property._id}`;
    const method = 'delete';
    itReturnsErrorForUnverifiedVendor({
      endpoint,
      method,
      user: vendorUser,
      useExistingUser: true,
    });

    context('when token is used', () => {
      beforeEach(async () => {
        await User.findByIdAndDelete(vendorUser._id);
      });
      it('returns token error', (done) => {
        request()
          .delete(`/api/v1/property/delete/${property._id}`)
          .set('authorization', vendorToken)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Invalid token');
            done();
          });
      });
    });

    context('with an invalid property id', () => {
      it('returns an error', (done) => {
        request()
          .delete(`/api/v1/property/delete/${invalidPropertyId}`)
          .set('authorization', vendorToken)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
          });
      });
    });

    context('without token', () => {
      it('returns error', (done) => {
        request()
          .delete(`/api/v1/property/delete/${property._id}`)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Token needed to access resources');
            done();
          });
      });
    });
  });

  describe('Get one property', () => {
    const invalidPropertyId = mongoose.Types.ObjectId();
    const property = PropertyFactory.build(
      { addedBy: vendorUser._id, updatedBy: vendorUser._id },
      { generateId: true },
    );

    beforeEach(async () => {
      await addProperty(property);
    });

    context('with a valid token & id', () => {
      [...new Array(3)].map((_, index) =>
        it('successfully returns property', (done) => {
          request()
            .get(`/api/v1/property/${property._id}`)
            .set('authorization', [vendorToken, adminToken, userToken][index])
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('property');
              done();
            });
        }),
      );
    });

    context('when token is invalid', () => {
      beforeEach(async () => {
        await User.findByIdAndDelete(vendorUser._id);
      });
      it('returns not found', (done) => {
        request()
          .get(`/api/v1/property/${property._id}`)
          .set('authorization', vendorToken)
          .send(property)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Invalid token');
            done();
          });
      });
    });

    context('with an invalid property id', () => {
      it('returns not found', (done) => {
        request()
          .get(`/api/v1/property/${invalidPropertyId}`)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            done();
          });
      });
    });

    context('without token', () => {
      it('returns error', (done) => {
        request()
          .get(`/api/v1/property/${property._id}`)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Token needed to access resources');
            done();
          });
      });
    });

    context('when getOneProperty service fails', () => {
      it('returns the error', (done) => {
        sinon.stub(Property, 'aggregate').throws(new Error('Type Error'));
        request()
          .get(`/api/v1/property/${property._id}`)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(500);
            done();
            Property.aggregate.restore();
          });
      });
    });
  });

  describe('Get all properties', () => {
    const vendorUser2 = UserFactory.build(
      { role: USER_ROLE.VENDOR, activated: true },
      { generateId: true },
    );
    const properties1 = PropertyFactory.buildList(13, {
      addedBy: vendorUser._id,
      updatedBy: vendorUser._id,
    });
    const properties2 = PropertyFactory.buildList(5, {
      addedBy: vendorUser2._id,
      updatedBy: vendorUser2._id,
    });

    context('when no property is found', () => {
      it('returns not found', (done) => {
        request()
          .get('/api/v1/property/all')
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.properties.length).to.be.eql(0);
            done();
          });
      });
    });

    describe('when properties exist in db', () => {
      beforeEach(async () => {
        await addUser(vendorUser2);
        await Property.insertMany(properties1);
        await Property.insertMany(properties2);
      });

      context('with a admin token & id', () => {
        it('returns all properties', (done) => {
          request()
            .get('/api/v1/property/all')
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('properties');
              expect(res.body.properties.length).to.be.eql(18);
              expect(res.body.properties[0]).to.have.property('name');
              expect(res.body.properties[0]).to.have.property('address');
              expect(res.body.properties[0]).to.have.property('mainImage');
              expect(res.body.properties[0]).to.have.property('gallery');
              expect(res.body.properties[0]).to.have.property('price');
              expect(res.body.properties[0]).to.have.property('houseType');
              expect(res.body.properties[0]).to.have.property('description');
              done();
            });
        });
      });

      const endpoint = '/api/v1/property/all';
      const method = 'get';
      itReturnsErrorForUnverifiedVendor({
        endpoint,
        method,
        user: vendorUser,
        useExistingUser: true,
      });

      context('with a vendor token & id', () => {
        it('returns all properties', (done) => {
          request()
            .get('/api/v1/property/all')
            .set('authorization', vendorToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('properties');
              expect(res.body.properties.length).to.be.eql(13);
              expect(res.body.properties[0]).to.have.property('name');
              expect(res.body.properties[0]).to.have.property('address');
              expect(res.body.properties[0]).to.have.property('mainImage');
              expect(res.body.properties[0]).to.have.property('gallery');
              expect(res.body.properties[0]).to.have.property('price');
              expect(res.body.properties[0]).to.have.property('houseType');
              expect(res.body.properties[0]).to.have.property('description');
              done();
            });
        });
      });

      context('with a vendor token not attached to any property', () => {
        it('returns no property', (done) => {
          request()
            .get('/api/v1/property/all')
            .set('authorization', invalidVendorToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('properties');
              expect(res.body.properties.length).to.be.eql(0);
              done();
            });
        });
      });

      context('without token', () => {
        it('returns error', (done) => {
          request()
            .get('/api/v1/property/all')
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
          await User.findByIdAndDelete(adminUser._id);
        });
        it('returns token error', (done) => {
          request()
            .get('/api/v1/property/all')
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(404);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Invalid token');
              done();
            });
        });
      });

      context('when getAllUserProperties service fails', () => {
        it('returns the error', (done) => {
          sinon.stub(Property, 'aggregate').throws(new Error('Type Error'));
          request()
            .get('/api/v1/property/all')
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(500);
              done();
              Property.aggregate.restore();
            });
        });
      });
    });
  });

  describe('Get all properties added by an vendor', () => {
    const properties = PropertyFactory.buildList(18, {
      addedBy: vendorUser._id,
      updatedBy: vendorUser._id,
    });

    context('when no property is found', () => {
      it('returns not found', (done) => {
        request()
          .get(`/api/v1/property/added-by/${vendorUser._id}`)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.properties.length).to.be.eql(0);
            done();
          });
      });
    });

    describe('when properties exist in db', () => {
      beforeEach(async () => {
        await Property.insertMany(properties);
      });

      context('with a valid token & id', () => {
        it('returns successful payload', (done) => {
          request()
            .get(`/api/v1/property/added-by/${vendorUser._id}`)
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body.properties.length).to.be.eql(18);
              expect(res.body).to.have.property('properties');
              done();
            });
        });
      });

      context('with unauthorized user access token', () => {
        [...new Array(2)].map((_, index) =>
          it('successfully returns property', (done) => {
            request()
              .get(`/api/v1/property/added-by/${vendorUser._id}`)
              .set('authorization', [vendorToken, userToken][index])
              .end((err, res) => {
                expect(res).to.have.status(403);
                expect(res.body.success).to.be.eql(false);
                expect(res.body.message).to.be.eql('You are not permitted to perform this action');
                done();
              });
          }),
        );
      });

      context('with id is not a valid mongo id', () => {
        it('returns successful payload', (done) => {
          request()
            .get(`/api/v1/property/added-by/${vendorUser._id}a`)
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Invalid Id supplied');
              done();
            });
        });
      });

      context('without token', () => {
        it('returns error', (done) => {
          request()
            .get(`/api/v1/property/added-by/${vendorUser._id}`)
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
          await User.findByIdAndDelete(adminUser._id);
        });
        it('returns token error', (done) => {
          request()
            .get(`/api/v1/property/added-by/${vendorUser._id}`)
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(404);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Invalid token');
              done();
            });
        });
      });

      context('when getAllPropertiesAddedByVendor service fails', () => {
        it('returns the error', (done) => {
          sinon.stub(Property, 'aggregate').throws(new Error('Type Error'));
          request()
            .get(`/api/v1/property/added-by/${vendorUser._id}`)
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(500);
              done();
              Property.aggregate.restore();
            });
        });
      });
    });
  });

  describe('Search Through Properties', () => {
    const property1 = PropertyFactory.build(
      {
        addedBy: vendorUser._id,
        updatedBy: vendorUser._id,
        houseType: '3 bedroom duplex',
        address: {
          state: 'lagos',
          city: 'lekki',
        },
      },
      { generateId: true },
    );
    const property2 = PropertyFactory.build(
      {
        addedBy: vendorUser._id,
        updatedBy: vendorUser._id,
        houseType: '4 bedroom detatched duplex',
        address: {
          state: 'lagos',
          city: 'epe',
        },
      },
      { generateId: true },
    );
    const property3 = PropertyFactory.build(
      {
        addedBy: vendorUser._id,
        updatedBy: vendorUser._id,
        houseType: '3 bedroom duplex',
        address: {
          state: 'ogun',
          city: 'ajah',
        },
      },
      { generateId: true },
    );

    const filter = {
      houseType: '3 bedroom duplex',
      state: 'lagos',
      city: 'lekki',
    };

    context('when no property is found', () => {
      it('returns no property', (done) => {
        request()
          .post('/api/v1/property/search')
          .set('authorization', userToken)
          .send(filter)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.properties.length).to.be.eql(0);
            done();
          });
      });
    });

    describe('when properties exist in db', () => {
      beforeEach(async () => {
        await addProperty(property1);
        await addProperty(property2);
        await addProperty(property3);
      });

      context('with a valid token & id', () => {
        it('returns a valid search result', (done) => {
          request()
            .post('/api/v1/property/search')
            .set('authorization', userToken)
            .send(filter)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('properties');
              expect(res.body.properties[0]).to.have.property('name');
              expect(res.body.properties[0]).to.have.property('address');
              expect(res.body.properties[0]).to.have.property('mainImage');
              expect(res.body.properties[0]).to.have.property('gallery');
              expect(res.body.properties[0]).to.have.property('price');
              expect(res.body.properties[0]).to.have.property('houseType');
              expect(res.body.properties[0]).to.have.property('description');
              expect(res.body.properties[0]._id).to.be.eql(property1._id.toString());
              expect(res.body.properties[0].assignedTo).to.not.include(regularUser._id.toString());
              done();
            });
        });
      });

      context('when filter is empty', () => {
        it('returns all properties', (done) => {
          request()
            .post('/api/v1/property/search')
            .set('authorization', userToken)
            .send({})
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('properties');
              expect(res.body.properties[0]._id).to.be.eql(property1._id.toString());
              expect(res.body.properties.length).to.be.eql(3);
              done();
            });
        });
      });

      context('when only state is sent', () => {
        it('returns similar properties', (done) => {
          request()
            .post('/api/v1/property/search')
            .set('authorization', userToken)
            .send({ state: filter.state })
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('properties');
              expect(res.body.properties[0]._id).to.be.eql(property1._id.toString());
              done();
            });
        });
      });

      context('when only house type is sent', () => {
        it('returns similar properties', (done) => {
          request()
            .post('/api/v1/property/search')
            .set('authorization', userToken)
            .send({ houseType: filter.houseType })
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('properties');
              expect(res.body.properties[0]._id).to.be.eql(property1._id.toString());
              done();
            });
        });
      });

      context('when only city is sent', () => {
        it('returns similar properties', (done) => {
          request()
            .post('/api/v1/property/search')
            .set('authorization', userToken)
            .send({ city: filter.city })
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('properties');
              expect(res.body.properties[0]._id).to.be.eql(property1._id.toString());
              done();
            });
        });
      });

      context('without token', () => {
        it('returns error', (done) => {
          request()
            .post('/api/v1/property/search')
            .send(filter)
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Token needed to access resources');
              done();
            });
        });
      });

      context('when state is lagos', () => {
        it('returns properties 1 & 2', (done) => {
          request()
            .post('/api/v1/property/search')
            .set('authorization', userToken)
            .send({ state: 'lagos' })
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('properties');
              expect(res.body.properties.length).to.be.eql(2);
              expect(res.body.properties[0]._id).to.be.eql(property1._id.toString());
              expect(res.body.properties[1].houseType).to.be.eql(property2.houseType);
              done();
            });
        });
      });

      context('when searchThroughProperties service fails', () => {
        it('returns the error', (done) => {
          sinon.stub(Property, 'aggregate').throws(new Error('Type Error'));
          request()
            .post('/api/v1/property/search')
            .set('authorization', userToken)
            .send(filter)
            .end((err, res) => {
              expect(res).to.have.status(500);
              done();
              Property.aggregate.restore();
            });
        });
      });

      context('when all properties have been assigned to user', () => {
        beforeEach(async () => {
          await assignPropertyToUser({
            userId: regularUser._id,
            propertyId: property1._id,
            vendor: vendorUser,
          });
          await assignPropertyToUser({
            userId: regularUser._id,
            propertyId: property2._id,
            vendor: vendorUser,
          });
          await assignPropertyToUser({
            userId: regularUser._id,
            propertyId: property3._id,
            vendor: vendorUser,
          });
        });
        it('returns no property', (done) => {
          request()
            .post('/api/v1/property/search')
            .set('authorization', userToken)
            .send({})
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('properties');
              expect(res.body.properties.length).to.be.eql(0);
              done();
            });
        });
      });

      context('when no property has been assigned to user', () => {
        it('returns all properties', (done) => {
          request()
            .post('/api/v1/property/search')
            .set('authorization', userToken)
            .send({})
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('properties');
              expect(res.body.properties.length).to.be.eql(3);
              done();
            });
        });
      });

      context('when 2 properties have been assigned to user', () => {
        beforeEach(async () => {
          await assignPropertyToUser({
            userId: regularUser._id,
            propertyId: property1._id,
            vendor: vendorUser,
          });
          await assignPropertyToUser({
            userId: regularUser._id,
            propertyId: property2._id,
            vendor: vendorUser,
          });
        });
        it('returns one property', (done) => {
          request()
            .post('/api/v1/property/search')
            .set('authorization', userToken)
            .send({})
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('properties');
              expect(res.body.properties.length).to.be.eql(1);
              expect(res.body.properties[0]._id).to.be.eql(property3._id.toString());
              done();
            });
        });
      });
    });
  });

  describe('Get distinct property states & types', () => {
    const property1 = PropertyFactory.build({
      houseType: '2 bedroom apartment',
      address: { state: 'taraba' },
      addedBy: vendorUser._id,
      updatedBy: vendorUser._id,
    });
    const property2 = PropertyFactory.build({
      houseType: '4 bedroom semi-detatched',
      address: { state: 'taraba' },
      addedBy: vendorUser._id,
      updatedBy: vendorUser._id,
    });
    const property3 = PropertyFactory.build({
      houseType: '4 bedroom semi-detatched',
      address: { state: 'kano' },
      addedBy: vendorUser._id,
      updatedBy: vendorUser._id,
    });

    describe('when properties exist in db', () => {
      beforeEach(async () => {
        await addProperty(property1);
        await addProperty(property2);
        await addProperty(property3);
      });

      context('with a valid token & id', () => {
        it('returns successful payload', (done) => {
          request()
            .get('/api/v1/property/available-options')
            .set('authorization', userToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('availableFields');
              expect(res.body.availableFields.houseTypes.length).to.be.eql(2);
              expect(res.body.availableFields.states.length).to.be.eql(2);
              expect(res.body.availableFields.houseTypes)
                .to.be.an('array')
                .that.includes('4 bedroom semi-detatched');
              expect(res.body.availableFields.houseTypes)
                .to.be.an('array')
                .that.includes('2 bedroom apartment');
              expect(res.body.availableFields.states).to.be.an('array').that.includes('taraba');
              expect(res.body.availableFields.states).to.be.an('array').that.includes('kano');
              done();
            });
        });
      });

      context('without token', () => {
        it('returns error', (done) => {
          request()
            .get('/api/v1/property/available-options')
            .end((err, res) => {
              expect(res).to.have.status(403);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Token needed to access resources');
              done();
            });
        });
      });

      context('when getAvailablePropertyOptions service fails', () => {
        it('returns the error', (done) => {
          sinon.stub(Property, 'aggregate').throws(new Error('Type Error'));
          request()
            .get('/api/v1/property/available-options')
            .set('authorization', userToken)
            .end((err, res) => {
              expect(res).to.have.status(500);
              done();
              Property.aggregate.restore();
            });
        });
      });
    });
  });

  describe('Load transaction sum and info of assigned property', () => {
    const property1 = PropertyFactory.build(
      {
        addedBy: vendorUser._id,
        updatedBy: vendorUser._id,
      },
      { generateId: true },
    );
    const property2 = PropertyFactory.build(
      {
        addedBy: vendorUser._id,
        updatedBy: vendorUser._id,
      },
      { generateId: true },
    );

    const enquiry1 = EnquiryFactory.build(
      {
        propertyId: property1._id,
        userId: regularUser._id,
      },
      { generateId: true },
    );
    const enquiry2 = EnquiryFactory.build(
      {
        propertyId: property2._id,
        userId: regularUser._id,
      },
      { generateId: true },
    );

    const offer1 = OfferFactory.build(
      {
        enquiryId: enquiry1._id,
        userId: regularUser._id,
        vendorId: vendorUser._id,
      },
      { generateId: true },
    );
    const offer2 = OfferFactory.build(
      {
        enquiryId: enquiry2._id,
        userId: regularUser._id,
        vendorId: vendorUser._id,
      },
      { generateId: true },
    );

    const transaction1 = TransactionFactory.build(
      {
        propertyId: property1._id,
        offerId: offer1._id,
        userId: regularUser._id,
        adminId: adminUser._id,
        amount: 40000,
      },
      { generateId: true },
    );

    beforeEach(async () => {
      await addProperty(property1);
      await addProperty(property2);
      await addEnquiry(enquiry1);
      await addEnquiry(enquiry2);
      await createOffer(offer1);
      await createOffer(offer2);
      await addTransaction(transaction1);
    });

    context('with a valid token & id', () => {
      it('returns successful payload', (done) => {
        request()
          .get(`/api/v1/property/assigned/${offer1._id}`)
          .set('authorization', userToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.property.totalPaid).to.be.eql(transaction1.amount);
            expect(res.body.property.offer._id).to.be.eql(offer1._id.toString());
            expect(res.body.property.offer.enquiryInfo._id).to.be.eql(enquiry1._id.toString());
            expect(res.body.property.offer.propertyInfo._id).to.be.eql(property1._id.toString());
            expect(res.body.property.offer.transactionInfo[0]._id).to.be.eql(
              transaction1._id.toString(),
            );
            done();
          });
      });
    });

    context('when no transaction has been made', () => {
      it('returns successful payload', (done) => {
        request()
          .get(`/api/v1/property/assigned/${offer2._id}`)
          .set('authorization', userToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.property.totalPaid).to.be.eql(0);
            expect(res.body.property.offer._id).to.be.eql(offer2._id.toString());
            expect(res.body.property.offer.enquiryInfo._id).to.be.eql(enquiry2._id.toString());
            expect(res.body.property.offer.propertyInfo._id).to.be.eql(property2._id.toString());
            done();
          });
      });
    });

    context('without token', () => {
      it('returns error', (done) => {
        request()
          .get(`/api/v1/property/assigned/${offer1._id}`)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Token needed to access resources');
            done();
          });
      });
    });

    context('when getTotalAmountPaidForProperty service fails', () => {
      it('returns the error', (done) => {
        sinon.stub(Transaction, 'aggregate').throws(new Error('Type Error'));
        request()
          .get(`/api/v1/property/assigned/${offer1._id}`)
          .set('authorization', userToken)
          .end((err, res) => {
            expect(res).to.have.status(500);
            done();
            Transaction.aggregate.restore();
          });
      });
    });
    context('when getOffer service fails', () => {
      it('returns the error', (done) => {
        sinon.stub(Offer, 'aggregate').throws(new Error('Type Error'));
        request()
          .get(`/api/v1/property/assigned/${offer1._id}`)
          .set('authorization', userToken)
          .end((err, res) => {
            expect(res).to.have.status(500);
            done();
            Offer.aggregate.restore();
          });
      });
    });
  });

  describe('Load all properties assigned to a user', () => {
    const allOfferStatus = Object.keys(OFFER_STATUS);
    const properties = allOfferStatus.map(() =>
      PropertyFactory.build(
        {
          addedBy: vendorUser._id,
          updatedBy: vendorUser._id,
        },
        { generateId: true },
      ),
    );

    const enquiries = allOfferStatus.map((_, index) =>
      EnquiryFactory.build(
        {
          propertyId: properties[index]._id,
          userId: regularUser._id,
          vendorId: properties[index].addedBy,
        },
        { generateId: true },
      ),
    );

    const offers = allOfferStatus.map((_, index) =>
      OfferFactory.build(
        {
          propertyId: properties[index]._id,
          enquiryId: enquiries[index]._id,
          userId: regularUser._id,
          vendorId: vendorUser._id,
          status: OFFER_STATUS[allOfferStatus[index]],
          referenceCode: '123456XXX',
        },
        { generateId: true },
      ),
    );

    beforeEach(async () => {
      await Property.insertMany(properties);
      await Enquiry.insertMany(enquiries);
      await Offer.insertMany(offers);
    });

    context('with a valid token & id', () => {
      it('returns successful payload', (done) => {
        request()
          .get('/api/v1/property/assigned')
          .set('authorization', userToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.properties.length).to.be.eql(3);
            res.body.properties.forEach(({ _id, property }, index) => {
              expect(_id).to.be.eql(offers[index + 1]._id.toString());
              expect(property._id).to.be.eql(properties[index + 1]._id.toString());
            });
            done();
          });
      });
    });

    context('without token', () => {
      it('returns error', (done) => {
        request()
          .get('/api/v1/property/assigned')
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Token needed to access resources');
            done();
          });
      });
    });

    context('when getOffer service fails', () => {
      it('returns the error', (done) => {
        sinon.stub(Offer, 'aggregate').throws(new Error('Type Error'));
        request()
          .get('/api/v1/property/assigned')
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
