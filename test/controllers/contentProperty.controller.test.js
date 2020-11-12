import mongoose from 'mongoose';
import { expect, request, useDatabase } from '../config';
import ContentPropertyFactory from '../factories/contentProperty.factory';
import AreaFactory from '../factories/area.factory';
import UserFactory from '../factories/user.factory';
import { addUser } from '../../server/services/user.service';
import { addArea } from '../../server/services/area.service';
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
            expect(res.body.message).to.be.eql('Property added successfully');
            expect(res.body.property).to.include({ ...property, areaId: areaId.toString() });
            expect(res.body.property.areaId).to.be.eql(areaId.toString());
            done();
          });
      });
    });

    context('when admin token is used', () => {
      beforeEach(async () => {
        adminToken = await addUser(admin);
      });
      it('returns successful property', (done) => {
        const property = ContentPropertyFactory.build({ areaId });
        request()
          .post('/api/v1/content-property/add')
          .set('authorization', adminToken)
          .send(property)
          .end((err, res) => {
            expect(res).to.have.status(201);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Property added successfully');
            expect(res.body.property).to.include({ ...property, areaId: areaId.toString() });
            expect(res.body.property.areaId).to.be.eql(areaId.toString());
            done();
          });
      });
    });

    context('when user token is used', () => {
      beforeEach(async () => {
        userToken = await addUser(user);
      });
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
});
