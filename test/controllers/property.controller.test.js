import mongoose from 'mongoose';
import { expect, request, sinon, useDatabase } from '../config';
import Property from '../../server/models/property.model';
import PropertyFactory from '../factories/property.factory';
import UserFactory from '../factories/user.factory';
import { addUser } from '../../server/services/user.service';
import { addProperty } from '../../server/services/property.service';

useDatabase();

let token;
const _id = mongoose.Types.ObjectId();
const user = UserFactory.build({ _id, role: 0, activated: true });

beforeEach(async () => {
  token = await addUser(user);
});

describe('Add Property Route', () => {
  context('with valid data', () => {
    it('returns successful property', (done) => {
      const property = PropertyFactory.build();
      request()
        .post('/api/v1/property/add')
        .set('authorization', token)
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

  context('with invalid data', () => {
    context('when name is empty', () => {
      it('returns an error', (done) => {
        const property = PropertyFactory.build({ name: '' });
        request()
          .post('/api/v1/property/add')
          .set('authorization', token)
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
  });
});

describe('Update Property', () => {
  const id = mongoose.Types.ObjectId();
  const property = PropertyFactory.build({ _id: id, addedBy: _id, updatedBy: _id });

  beforeEach(async () => {
    await addProperty(property);
  });

  const newProperty = {
    id,
    price: 30200000,
    units: 87,
  };

  context('with valid data & token', () => {
    it('returns a updated property', (done) => {
      request()
        .put('/api/v1/property/update')
        .set('authorization', token)
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

  context('with invalid property', () => {
    it('returns a updated user', (done) => {
      request()
        .put('/api/v1/property/update')
        .set('authorization', token)
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
        .set('authorization', token)
        .send(newProperty)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body.success).to.be.eql(false);
          done();
          Property.findByIdAndUpdate.restore();
        });
    });
  });
});

describe('Get one property', () => {
  const id = mongoose.Types.ObjectId();
  const property = PropertyFactory.build({ _id: id, addedBy: _id, updatedBy: _id });

  beforeEach(async () => {
    await addProperty(property);
  });

  context('with a valid token & id', () => {
    it('returns successful payload', (done) => {
      request()
        .get(`/api/v1/property/${id}`)
        .set('authorization', token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.success).to.be.eql(true);
          expect(res.body).to.have.property('property');
          done();
        });
    });
  });

  context('with an invalid property id', () => {
    it('returns not found', (done) => {
      request()
        .get(`/api/v1/property/${_id}`)
        .set('authorization', token)
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
});

describe('Get all properties', () => {
  const id = mongoose.Types.ObjectId();
  const property = PropertyFactory.build({ _id: id, addedBy: _id, updatedBy: _id });

  context('when no property is found', () => {
    it('returns not found', (done) => {
      request()
        .get('/api/v1/property/all')
        .set('authorization', token)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body.success).to.be.eql(false);
          expect(res.body.message).to.be.eql('No properties available');
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
          .set('authorization', token)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body).to.have.property('properties');
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

    context('when getAllProperties service fails', () => {
      it('returns the error', (done) => {
        sinon.stub(Property, 'find').throws(new Error('Type Error'));
        request()
          .get('/api/v1/property/all')
          .set('authorization', token)
          .end((err, res) => {
            expect(res).to.have.status(500);
            done();
            Property.find.restore();
          });
      });
    });
  });
});

describe('Delete property', () => {
  const id = mongoose.Types.ObjectId();
  const property = PropertyFactory.build({ _id: id, addedBy: _id, updatedBy: _id });

  beforeEach(async () => {
    await addProperty(property);
  });

  context('with a valid token & id', () => {
    it('successfully deletes property', (done) => {
      request()
        .delete(`/api/v1/property/delete/${id}`)
        .set('authorization', token)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.success).to.be.eql(true);
          expect(res.body.message).to.be.eql('Property deleted');
          done();
        });
    });
  });

  context('with an invalid property id', () => {
    it('returns an error', (done) => {
      request()
        .delete(`/api/v1/property/delete/${_id}`)
        .set('authorization', token)
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
