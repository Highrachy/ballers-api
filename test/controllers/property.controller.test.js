import mongoose from 'mongoose';
import { expect, request, sinon, useDatabase } from '../config';
import Property from '../../server/models/property.model';
import User from '../../server/models/user.model';
import PropertyFactory from '../factories/property.factory';
import UserFactory from '../factories/user.factory';
import { addUser, assignPropertyToUser } from '../../server/services/user.service';
import { addProperty } from '../../server/services/property.service';

useDatabase();

let adminToken;
let userToken;
const adminId = mongoose.Types.ObjectId();
const userId = mongoose.Types.ObjectId();
const adminUser = UserFactory.build({ _id: adminId, role: 0, activated: true });
const regularUser = UserFactory.build({ _id: userId, role: 1, activated: true });

describe('Property Controller', () => {
  beforeEach(async () => {
    adminToken = await addUser(adminUser);
    userToken = await addUser(regularUser);
  });

  describe('Add Property Route', () => {
    context('with valid data', () => {
      it('returns successful property', (done) => {
        const property = PropertyFactory.build();
        request()
          .post('/api/v1/property/add')
          .set('authorization', adminToken)
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

    context('when user token is used', () => {
      beforeEach(async () => {
        await User.findByIdAndDelete(adminId);
      });
      it('returns token error', (done) => {
        const property = PropertyFactory.build();
        request()
          .post('/api/v1/property/add')
          .set('authorization', adminToken)
          .send(property)
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Invalid token');
            done();
          });
      });
    });

    context('with unauthorized user access token', () => {
      it('returns an error', (done) => {
        const property = PropertyFactory.build();
        request()
          .post('/api/v1/property/add')
          .set('authorization', userToken)
          .send(property)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('You are not permitted to perform this action');
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
            .set('authorization', adminToken)
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
            .set('authorization', adminToken)
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
            .set('authorization', adminToken)
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
            .set('authorization', adminToken)
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
            .set('authorization', adminToken)
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
            .set('authorization', adminToken)
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
            .set('authorization', adminToken)
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
            .set('authorization', adminToken)
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
            .set('authorization', adminToken)
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
            .set('authorization', adminToken)
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
            .set('authorization', adminToken)
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
            .set('authorization', adminToken)
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
            .set('authorization', adminToken)
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
            .set('authorization', adminToken)
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
            .set('authorization', adminToken)
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
            .set('authorization', adminToken)
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
            .set('authorization', adminToken)
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
            .set('authorization', adminToken)
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
            .set('authorization', adminToken)
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
            .set('authorization', adminToken)
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
            .set('authorization', adminToken)
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
    const id = mongoose.Types.ObjectId();
    const property = PropertyFactory.build({ _id: id, addedBy: adminId, updatedBy: adminId });
    const newProperty = {
      id,
      price: 30200000,
      units: 87,
    };

    beforeEach(async () => {
      await addProperty(property);
    });

    context('with valid data & token', () => {
      it('returns a updated property', (done) => {
        request()
          .put('/api/v1/property/update')
          .set('authorization', adminToken)
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
        await User.findByIdAndDelete(adminId);
      });
      it('returns token error', (done) => {
        request()
          .put('/api/v1/property/update')
          .set('authorization', adminToken)
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
          .set('authorization', adminToken)
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
          .set('authorization', adminToken)
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
          const invalidProperty = PropertyFactory.build({ id, name: '' });
          request()
            .put('/api/v1/property/update')
            .set('authorization', adminToken)
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
          const invalidProperty = PropertyFactory.build({ id, address: { street1: '' } });
          request()
            .put('/api/v1/property/update')
            .set('authorization', adminToken)
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
          const invalidProperty = PropertyFactory.build({ id, address: { street2: '' } });
          request()
            .put('/api/v1/property/update')
            .set('authorization', adminToken)
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
          const invalidProperty = PropertyFactory.build({ id, address: { city: '' } });
          request()
            .put('/api/v1/property/update')
            .set('authorization', adminToken)
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
          const invalidProperty = PropertyFactory.build({ id, address: { state: '' } });
          request()
            .put('/api/v1/property/update')
            .set('authorization', adminToken)
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
          const invalidProperty = PropertyFactory.build({ id, address: { country: '' } });
          request()
            .put('/api/v1/property/update')
            .set('authorization', adminToken)
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
          const invalidProperty = PropertyFactory.build({ id, price: '' });
          request()
            .put('/api/v1/property/update')
            .set('authorization', adminToken)
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
          const invalidProperty = PropertyFactory.build({ id, units: '' });
          request()
            .put('/api/v1/property/update')
            .set('authorization', adminToken)
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
          const invalidProperty = PropertyFactory.build({ id, houseType: '' });
          request()
            .put('/api/v1/property/update')
            .set('authorization', adminToken)
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
          const invalidProperty = PropertyFactory.build({ id, bedrooms: '' });
          request()
            .put('/api/v1/property/update')
            .set('authorization', adminToken)
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
          const invalidProperty = PropertyFactory.build({ id, toilets: '' });
          request()
            .put('/api/v1/property/update')
            .set('authorization', adminToken)
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
          const invalidProperty = PropertyFactory.build({ id, description: '' });
          request()
            .put('/api/v1/property/update')
            .set('authorization', adminToken)
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
          const invalidProperty = PropertyFactory.build({ id, floorPlans: '' });
          request()
            .put('/api/v1/property/update')
            .set('authorization', adminToken)
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
          const invalidProperty = PropertyFactory.build({ id, neighborhood: '' });
          request()
            .put('/api/v1/property/update')
            .set('authorization', adminToken)
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
          const invalidProperty = PropertyFactory.build({ id, neighborhood: [] });
          request()
            .put('/api/v1/property/update')
            .set('authorization', adminToken)
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
          const invalidProperty = PropertyFactory.build({ id, mainImage: '' });
          request()
            .put('/api/v1/property/update')
            .set('authorization', adminToken)
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
          const invalidProperty = PropertyFactory.build({ id, gallery: '' });
          request()
            .put('/api/v1/property/update')
            .set('authorization', adminToken)
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
          const invalidProperty = PropertyFactory.build({ id, gallery: [] });
          request()
            .put('/api/v1/property/update')
            .set('authorization', adminToken)
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
          const invalidProperty = PropertyFactory.build({ id, mapLocation: { longitude: '' } });
          request()
            .put('/api/v1/property/update')
            .set('authorization', adminToken)
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
          const invalidProperty = PropertyFactory.build({ id, mapLocation: { latitude: '' } });
          request()
            .put('/api/v1/property/update')
            .set('authorization', adminToken)
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
    const id = mongoose.Types.ObjectId();
    const property = PropertyFactory.build({ _id: id, addedBy: adminId, updatedBy: adminId });

    beforeEach(async () => {
      await addProperty(property);
    });

    context('with a valid token & id', () => {
      it('successfully deletes property', (done) => {
        request()
          .delete(`/api/v1/property/delete/${id}`)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Property deleted');
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
          .delete(`/api/v1/property/delete/${id}`)
          .set('authorization', adminToken)
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
          .delete(`/api/v1/property/delete/${adminId}`)
          .set('authorization', adminToken)
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
          .delete(`/api/v1/property/delete/${id}`)
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
    const id = mongoose.Types.ObjectId();
    const property = PropertyFactory.build({ _id: id, addedBy: adminId, updatedBy: adminId });

    beforeEach(async () => {
      await addProperty(property);
    });

    context('with a valid token & id', () => {
      it('returns successful payload', (done) => {
        request()
          .get(`/api/v1/property/${id}`)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body).to.have.property('property');
            done();
          });
      });
    });

    context('when user token is used', () => {
      beforeEach(async () => {
        await User.findByIdAndDelete(adminId);
      });
      it('returns token error', (done) => {
        request()
          .get(`/api/v1/property/${id}`)
          .set('authorization', adminToken)
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
          .get(`/api/v1/property/${adminId}`)
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
          .get(`/api/v1/property/${id}`)
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
          .get(`/api/v1/property/${id}`)
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
    const id = mongoose.Types.ObjectId();
    const property = PropertyFactory.build({ _id: id, addedBy: adminId, updatedBy: adminId });

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
        await addProperty(property);
      });

      context('with a valid token & id', () => {
        it('returns successful payload', (done) => {
          request()
            .get('/api/v1/property/all')
            .set('authorization', adminToken)
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

      context('when token is used', () => {
        beforeEach(async () => {
          await User.findByIdAndDelete(adminId);
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

  describe('Get all properties added by an admin', () => {
    const id = mongoose.Types.ObjectId();
    const property = PropertyFactory.build({ _id: id, addedBy: adminId, updatedBy: adminId });

    context('when no property is found', () => {
      it('returns not found', (done) => {
        request()
          .get(`/api/v1/property/added-by/${adminId}`)
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
        await addProperty(property);
      });

      context('with a valid token & id', () => {
        it('returns successful payload', (done) => {
          request()
            .get(`/api/v1/property/added-by/${adminId}`)
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('properties');
              done();
            });
        });
      });

      context('with id is not a valid mongo id', () => {
        it('returns successful payload', (done) => {
          request()
            .get(`/api/v1/property/added-by/${adminId}a`)
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
            .get(`/api/v1/property/added-by/${adminId}`)
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
            .get(`/api/v1/property/added-by/${adminId}`)
            .set('authorization', adminToken)
            .end((err, res) => {
              expect(res).to.have.status(404);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Invalid token');
              done();
            });
        });
      });

      context('when getAllPropertiesAddedByAnAdmin service fails', () => {
        it('returns the error', (done) => {
          sinon.stub(Property, 'aggregate').throws(new Error('Type Error'));
          request()
            .get(`/api/v1/property/added-by/${adminId}`)
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
    const propertyId1 = mongoose.Types.ObjectId();
    const propertyId2 = mongoose.Types.ObjectId();
    const propertyId3 = mongoose.Types.ObjectId();
    const property1 = PropertyFactory.build({
      _id: propertyId1,
      addedBy: adminId,
      updatedBy: adminId,
      houseType: '3 bedroom duplex',
      address: {
        state: 'lagos',
        city: 'lekki',
      },
    });
    const property2 = PropertyFactory.build({
      _id: propertyId2,
      addedBy: adminId,
      updatedBy: adminId,
      houseType: '4 bedroom detatched duplex',
      address: {
        state: 'lagos',
        city: 'epe',
      },
    });
    const property3 = PropertyFactory.build({
      _id: propertyId3,
      addedBy: adminId,
      updatedBy: adminId,
      houseType: '3 bedroom duplex',
      address: {
        state: 'ogun',
        city: 'ajah',
      },
    });

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
              expect(res.body.properties[0].assignedTo).to.not.include(userId.toString());
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

      context('when all properties have been assigned', () => {
        beforeEach(async () => {
          await assignPropertyToUser({ userId, propertyId: propertyId1 });
          await assignPropertyToUser({ userId, propertyId: propertyId2 });
          await assignPropertyToUser({ userId, propertyId: propertyId3 });
        });
        it('returns no property', (done) => {
          request()
            .post('/api/v1/property/search')
            .set('authorization', userToken)
            .send(filter)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.eql(true);
              expect(res.body).to.have.property('properties');
              expect(res.body.properties.length).to.be.eql(0);
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
      addedBy: adminId,
      updatedBy: adminId,
    });
    const property2 = PropertyFactory.build({
      houseType: '4 bedroom semi-detatched',
      address: { state: 'taraba' },
      addedBy: adminId,
      updatedBy: adminId,
    });
    const property3 = PropertyFactory.build({
      houseType: '4 bedroom semi-detatched',
      address: { state: 'kano' },
      addedBy: adminId,
      updatedBy: adminId,
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
});
