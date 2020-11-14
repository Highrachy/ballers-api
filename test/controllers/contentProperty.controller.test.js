import mongoose from 'mongoose';
import { expect, request, useDatabase, sinon } from '../config';
import ContentProperty from '../../server/models/contentProperty.model';
import ContentPropertyFactory from '../factories/contentProperty.factory';
import AreaFactory from '../factories/area.factory';
import UserFactory from '../factories/user.factory';
import { addUser } from '../../server/services/user.service';
import { addArea } from '../../server/services/area.service';
import { addContentProperty } from '../../server/services/contentProperty.service';
import { USER_ROLE } from '../../server/helpers/constants';

useDatabase();

let userToken;
let adminToken;
let editorToken;

const user = UserFactory.build({ role: USER_ROLE.USER, activated: true });
const admin = UserFactory.build({ role: USER_ROLE.ADMIN, activated: true });
const editor = UserFactory.build({ role: USER_ROLE.EDITOR, activated: true });
const areaId = mongoose.Types.ObjectId();
const area = AreaFactory.build({ _id: areaId });

describe('Content Property Controller', () => {
  beforeEach(async () => {
    editorToken = await addUser(editor);
    adminToken = await addUser(admin);
    userToken = await addUser(user);
    await addArea(area);
  });

  describe('Add Content Property Route', () => {
    context('when editor token is used', () => {
      it('returns successful property', (done) => {
        const property = ContentPropertyFactory.build({ areaId });
        request()
          .post('/api/v1/content-property/add')
          .set('authorization', editorToken)
          .send(property)
          .end((err, res) => {
            expect(res).to.have.status(201);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Content property added successfully');
            expect(res.body.property).to.include({ ...property, areaId: areaId.toString() });
            expect(res.body.property.areaId).to.be.eql(areaId.toString());
            done();
          });
      });
    });

    context('when admin token is used', () => {
      it('returns successful property', (done) => {
        const property = ContentPropertyFactory.build({ areaId });
        request()
          .post('/api/v1/content-property/add')
          .set('authorization', adminToken)
          .send(property)
          .end((err, res) => {
            expect(res).to.have.status(201);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Content property added successfully');
            expect(res.body.property).to.include({ ...property, areaId: areaId.toString() });
            expect(res.body.property.areaId).to.be.eql(areaId.toString());
            done();
          });
      });
    });

    context('when user token is used', () => {
      it('returns forbidden', (done) => {
        const property = ContentPropertyFactory.build({ areaId });
        request()
          .post('/api/v1/content-property/add')
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
      context('when area id is invalid', () => {
        it('returns an error', (done) => {
          const invalidId = mongoose.Types.ObjectId();
          const property = ContentPropertyFactory.build({ areaId: invalidId });
          request()
            .post('/api/v1/content-property/add')
            .set('authorization', editorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(404);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Area not found');
              done();
            });
        });
      });

      context('when area id is empty', () => {
        it('returns an error', (done) => {
          const property = ContentPropertyFactory.build({ areaId: '' });
          request()
            .post('/api/v1/content-property/add')
            .set('authorization', editorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Area Id" is not allowed to be empty');
              done();
            });
        });
      });

      context('when category is empty', () => {
        it('returns an error', (done) => {
          const property = ContentPropertyFactory.build({ areaId, category: '' });
          request()
            .post('/api/v1/content-property/add')
            .set('authorization', editorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Category" is not allowed to be empty');
              done();
            });
        });
      });

      context('when house type is empty', () => {
        it('returns an error', (done) => {
          const property = ContentPropertyFactory.build({ areaId, houseType: '' });
          request()
            .post('/api/v1/content-property/add')
            .set('authorization', editorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property Type" is not allowed to be empty');
              done();
            });
        });
      });

      context('when price is empty', () => {
        it('returns an error', (done) => {
          const property = ContentPropertyFactory.build({ areaId, price: '' });
          request()
            .post('/api/v1/content-property/add')
            .set('authorization', editorToken)
            .send(property)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Price" must be a number');
              done();
            });
        });
      });
    });
  });

  describe('Update Content Property', () => {
    const contentPropertyId = mongoose.Types.ObjectId();
    const contentProperty = ContentPropertyFactory.build({
      _id: contentPropertyId,
      areaId,
      category: 'for rent',
      houseType: '1 bedroom',
      price: 4000000,
    });
    const newContentProperty = {
      id: contentPropertyId,
      areaId,
      category: 'for sale',
      houseType: 'Studio apartment',
      price: 1000000,
    };

    beforeEach(async () => {
      await addContentProperty(contentProperty);
    });

    context('when editor token is used', () => {
      it('returns updated content property', (done) => {
        request()
          .put('/api/v1/content-property/update')
          .set('authorization', editorToken)
          .send(newContentProperty)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.property.category).to.be.eql(newContentProperty.category);
            expect(res.body.property.areaId).to.be.eql(areaId.toString());
            expect(res.body.property.houseType).to.be.eql(newContentProperty.houseType);
            expect(res.body.property.price).to.be.eql(newContentProperty.price);
            done();
          });
      });
    });

    context('when admin token is used', () => {
      it('returns updated content property', (done) => {
        request()
          .put('/api/v1/content-property/update')
          .set('authorization', adminToken)
          .send(newContentProperty)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.property.category).to.be.eql(newContentProperty.category);
            expect(res.body.property.areaId).to.be.eql(areaId.toString());
            expect(res.body.property.houseType).to.be.eql(newContentProperty.houseType);
            expect(res.body.property.price).to.be.eql(newContentProperty.price);
            done();
          });
      });
    });

    context('when user token is used', () => {
      it('returns forbidden', (done) => {
        request()
          .put('/api/v1/content-property/update')
          .set('authorization', userToken)
          .send(newContentProperty)
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
          .put('/api/v1/content-property/update')
          .send(newContentProperty)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Token needed to access resources');
            done();
          });
      });
    });

    context('with invalid area id', () => {
      const invalidAreaId = mongoose.Types.ObjectId();
      it('returns a updated user', (done) => {
        request()
          .put('/api/v1/content-property/update')
          .set('authorization', editorToken)
          .send({ ...newContentProperty, areaId: invalidAreaId })
          .end((err, res) => {
            expect(res).to.have.status(404);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Area not found');
            done();
          });
      });
    });

    context('when update service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(ContentProperty, 'findByIdAndUpdate').throws(new Error('Type Error'));
        request()
          .put('/api/v1/content-property/update')
          .set('authorization', editorToken)
          .send(newContentProperty)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            ContentProperty.findByIdAndUpdate.restore();
          });
      });
    });

    context('with invalid data', () => {
      const property = ContentPropertyFactory.build({ id: contentPropertyId, areaId });
      context('when property id is empty', () => {
        it('returns an error', (done) => {
          request()
            .put('/api/v1/content-property/update')
            .set('authorization', editorToken)
            .send({ ...property, id: '' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property Id" is not allowed to be empty');
              done();
            });
        });
      });

      context('when area id is empty', () => {
        it('returns an error', (done) => {
          request()
            .put('/api/v1/content-property/update')
            .set('authorization', editorToken)
            .send({ ...property, areaId: '' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Area Id" is not allowed to be empty');
              done();
            });
        });
      });

      context('when category is empty', () => {
        it('returns an error', (done) => {
          request()
            .put('/api/v1/content-property/update')
            .set('authorization', editorToken)
            .send({ ...property, category: '' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Category" is not allowed to be empty');
              done();
            });
        });
      });

      context('when house type is empty', () => {
        it('returns an error', (done) => {
          request()
            .put('/api/v1/content-property/update')
            .set('authorization', editorToken)
            .send({ ...property, houseType: '' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Property Type" is not allowed to be empty');
              done();
            });
        });
      });

      context('when property price is empty', () => {
        it('returns an error', (done) => {
          request()
            .put('/api/v1/content-property/update')
            .set('authorization', editorToken)
            .send({ ...property, price: '' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Price" must be a number');
              done();
            });
        });
      });
    });
  });

  describe('Delete Content Property', () => {
    const contentPropertyId = mongoose.Types.ObjectId();
    const contentProperty = ContentPropertyFactory.build({ _id: contentPropertyId, areaId });

    beforeEach(async () => {
      await addContentProperty(contentProperty);
    });

    context('when editor token is used', () => {
      it('deletes content property', (done) => {
        request()
          .delete(`/api/v1/content-property/delete/${contentPropertyId}`)
          .set('authorization', editorToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Content property deleted');
            done();
          });
      });
    });

    context('when admin token is used', () => {
      it('deletes content property', (done) => {
        request()
          .delete(`/api/v1/content-property/delete/${contentPropertyId}`)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Content property deleted');
            done();
          });
      });
    });

    context('when user token is used', () => {
      it('returns forbidden', (done) => {
        request()
          .delete(`/api/v1/content-property/delete/${contentPropertyId}`)
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
          .delete(`/api/v1/content-property/delete/${contentPropertyId}`)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Token needed to access resources');
            done();
          });
      });
    });

    context('when delete content property service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(ContentProperty, 'findByIdAndDelete').throws(new Error('Type Error'));
        request()
          .delete(`/api/v1/content-property/delete/${contentPropertyId}`)
          .set('authorization', editorToken)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            ContentProperty.findByIdAndDelete.restore();
          });
      });
    });

    context('with invalid id supplied', () => {
      const invalidId = mongoose.Types.ObjectId();
      context('when content property id is invalid', () => {
        it('returns an error', (done) => {
          request()
            .delete(`/api/v1/content-property/delete/${invalidId}`)
            .set('authorization', editorToken)
            .end((err, res) => {
              expect(res).to.have.status(404);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Property not found');
              done();
            });
        });
      });
    });
  });
});
