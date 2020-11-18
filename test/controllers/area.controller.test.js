import mongoose from 'mongoose';
import { expect, request, useDatabase, sinon } from '../config';
import Area from '../../server/models/area.model';
import AreaFactory from '../factories/area.factory';
import UserFactory from '../factories/user.factory';
import ContentPropertyFactory from '../factories/contentProperty.factory';
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

describe('Area Controller', () => {
  beforeEach(async () => {
    editorToken = await addUser(editor);
    userToken = await addUser(user);
    adminToken = await addUser(admin);
  });

  describe('Add Area Route', () => {
    context('when editor token is used', () => {
      it('returns successful area', (done) => {
        const area = AreaFactory.build();
        request()
          .post('/api/v1/area/add')
          .set('authorization', editorToken)
          .send(area)
          .end((err, res) => {
            expect(res).to.have.status(201);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Area added successfully');
            expect(res.body.area).to.include(area);
            done();
          });
      });
    });

    context('when admin token is used', () => {
      it('returns successful area', (done) => {
        const area = AreaFactory.build();
        request()
          .post('/api/v1/area/add')
          .set('authorization', adminToken)
          .send(area)
          .end((err, res) => {
            expect(res).to.have.status(201);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Area added successfully');
            expect(res.body.area).to.include(area);
            done();
          });
      });
    });

    context('when user token is used', () => {
      it('returns forbidden', (done) => {
        const area = AreaFactory.build();
        request()
          .post('/api/v1/area/add')
          .set('authorization', userToken)
          .send(area)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('You are not permitted to perform this action');
            done();
          });
      });
    });

    context('with invalid data', () => {
      context('when area already exists with same state', () => {
        const ogunState = AreaFactory.build({ state: 'ogun', area: 'abeokuta' });
        beforeEach(async () => {
          await addArea(ogunState);
        });
        it('returns an error', (done) => {
          request()
            .post('/api/v1/area/add')
            .set('authorization', editorToken)
            .send(ogunState)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Area already exists');
              expect(res.body.error).to.be.eql('Area already exists');
              done();
            });
        });
      });

      context('when area is empty', () => {
        it('returns an error', (done) => {
          const area = AreaFactory.build({ area: '' });
          request()
            .post('/api/v1/area/add')
            .set('authorization', editorToken)
            .send(area)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Area" is not allowed to be empty');
              done();
            });
        });
      });

      context('when state is empty', () => {
        it('returns an error', (done) => {
          const area = AreaFactory.build({ state: '' });
          request()
            .post('/api/v1/area/add')
            .set('authorization', editorToken)
            .send(area)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"State" is not allowed to be empty');
              done();
            });
        });
      });

      context('when longitude is empty', () => {
        it('returns an error', (done) => {
          const area = AreaFactory.build({ longitude: '' });
          request()
            .post('/api/v1/area/add')
            .set('authorization', editorToken)
            .send(area)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Longitude" must be a number');
              done();
            });
        });
      });

      context('when latitude is empty', () => {
        it('returns an error', (done) => {
          const area = AreaFactory.build({ latitude: '' });
          request()
            .post('/api/v1/area/add')
            .set('authorization', editorToken)
            .send(area)
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Latitude" must be a number');
              done();
            });
        });
      });
    });
  });

  describe('Get all states', () => {
    const lagosState = AreaFactory.build({ state: 'lagos' });
    const areasInOyoState = AreaFactory.buildList(5, { state: 'oyo' });
    beforeEach(async () => {
      await addArea(lagosState);
      await Area.insertMany(areasInOyoState);
    });

    context('when editor token is used', () => {
      it('returns array of two states', (done) => {
        request()
          .get('/api/v1/area/states')
          .set('authorization', editorToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.states.length).to.be.eql(2);
            done();
          });
      });
    });

    context('when admin token is used', () => {
      it('returns array of two states', (done) => {
        request()
          .get('/api/v1/area/states')
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.states.length).to.be.eql(2);
            done();
          });
      });
    });

    context('when user token is is used', () => {
      it('returns forbidden', (done) => {
        request()
          .get('/api/v1/area/states')
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
          .get('/api/v1/area/states')
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Token needed to access resources');
            done();
          });
      });
    });

    context('when getStateAndArea service fails', () => {
      it('returns the error', (done) => {
        sinon.stub(Area, 'distinct').throws(new Error('Type Error'));
        request()
          .get('/api/v1/area/states')
          .set('authorization', editorToken)
          .end((err, res) => {
            expect(res).to.have.status(500);
            done();
            Area.distinct.restore();
          });
      });
    });
  });

  describe('Get all areas', () => {
    const state = 'lagos';
    const areas = AreaFactory.buildList(5, { state });
    beforeEach(async () => {
      await Area.insertMany(areas);
    });

    context('when editor token is used', () => {
      it('returns array of five areas', (done) => {
        request()
          .get(`/api/v1/area/${state}`)
          .set('authorization', editorToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.areas.length).to.be.eql(5);
            done();
          });
      });
    });

    context('when admin token is used', () => {
      it('returns array of five areas', (done) => {
        request()
          .get(`/api/v1/area/${state}`)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.areas.length).to.be.eql(5);
            done();
          });
      });
    });

    context('when user token is is used', () => {
      it('returns forbidden', (done) => {
        request()
          .get(`/api/v1/area/${state}`)
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
          .get(`/api/v1/area/${state}`)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Token needed to access resources');
            done();
          });
      });
    });

    context('when getStateAndArea service fails', () => {
      it('returns the error', (done) => {
        sinon.stub(Area, 'find').throws(new Error('Type Error'));
        request()
          .get(`/api/v1/area/${state}`)
          .set('authorization', editorToken)
          .end((err, res) => {
            expect(res).to.have.status(500);
            done();
            Area.find.restore();
          });
      });
    });
  });

  describe('Update Area', () => {
    const areaId = mongoose.Types.ObjectId();
    const area = AreaFactory.build({
      _id: areaId,
      area: 'ibadan',
      state: 'oyo',
      longitude: 40.7128,
      latitude: 74.006,
    });
    const updatedArea = {
      id: areaId,
      area: 'oshogbo',
      state: 'oyo',
      longitude: 30.7128,
      latitude: 79.666,
    };

    beforeEach(async () => {
      await addArea(area);
    });

    context('when editor token is used', () => {
      it('returns updated area', (done) => {
        request()
          .put('/api/v1/area/update')
          .set('authorization', editorToken)
          .send(updatedArea)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.area._id).to.be.eql(areaId.toString());
            expect(res.body.area.area).to.be.eql(updatedArea.area);
            expect(res.body.area.state).to.be.eql(updatedArea.state);
            expect(res.body.area.longitude).to.be.eql(updatedArea.longitude);
            expect(res.body.area.latitude).to.be.eql(updatedArea.latitude);
            done();
          });
      });
    });

    context('when admin token is used', () => {
      it('returns updated area', (done) => {
        request()
          .put('/api/v1/area/update')
          .set('authorization', adminToken)
          .send(updatedArea)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.area._id).to.be.eql(areaId.toString());
            expect(res.body.area.area).to.be.eql(updatedArea.area);
            expect(res.body.area.state).to.be.eql(updatedArea.state);
            expect(res.body.area.longitude).to.be.eql(updatedArea.longitude);
            expect(res.body.area.latitude).to.be.eql(updatedArea.latitude);
            done();
          });
      });
    });

    context('when user token is used', () => {
      it('returns forbidden', (done) => {
        request()
          .put('/api/v1/area/update')
          .set('authorization', userToken)
          .send(updatedArea)
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
          .put('/api/v1/area/update')
          .send(updatedArea)
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
          .put('/api/v1/area/update')
          .set('authorization', editorToken)
          .send({ ...updatedArea, id: invalidAreaId })
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
        sinon.stub(Area, 'findByIdAndUpdate').throws(new Error('Type Error'));
        request()
          .put('/api/v1/area/update')
          .set('authorization', editorToken)
          .send(updatedArea)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            Area.findByIdAndUpdate.restore();
          });
      });
    });

    context('with invalid data', () => {
      context('when area id is empty', () => {
        it('returns an error', (done) => {
          request()
            .put('/api/v1/area/update')
            .set('authorization', editorToken)
            .send({ ...updatedArea, id: '' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Area Id" is not allowed to be empty');
              done();
            });
        });
      });

      context('when state is empty', () => {
        it('returns an error', (done) => {
          request()
            .put('/api/v1/area/update')
            .set('authorization', editorToken)
            .send({ ...updatedArea, state: '' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"State" is not allowed to be empty');
              done();
            });
        });
      });

      context('when area is empty', () => {
        it('returns an error', (done) => {
          request()
            .put('/api/v1/area/update')
            .set('authorization', editorToken)
            .send({ ...updatedArea, area: '' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Area" is not allowed to be empty');
              done();
            });
        });
      });

      context('when latitude is empty', () => {
        it('returns an error', (done) => {
          request()
            .put('/api/v1/area/update')
            .set('authorization', editorToken)
            .send({ ...updatedArea, latitude: '' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Latitude" must be a number');
              done();
            });
        });
      });

      context('when longitude is empty', () => {
        it('returns an error', (done) => {
          request()
            .put('/api/v1/area/update')
            .set('authorization', editorToken)
            .send({ ...updatedArea, longitude: '' })
            .end((err, res) => {
              expect(res).to.have.status(412);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Validation Error');
              expect(res.body.error).to.be.eql('"Longitude" must be a number');
              done();
            });
        });
      });
    });
  });

  describe('Delete area', () => {
    const areaId = mongoose.Types.ObjectId();
    const area = AreaFactory.build({ _id: areaId, areaId });

    beforeEach(async () => {
      await addArea(area);
    });

    context('when editor token is used', () => {
      it('deletes area', (done) => {
        request()
          .delete(`/api/v1/area/delete/${areaId}`)
          .set('authorization', editorToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Area deleted');
            done();
          });
      });
    });

    context('when admin token is used', () => {
      it('deletes area', (done) => {
        request()
          .delete(`/api/v1/area/delete/${areaId}`)
          .set('authorization', adminToken)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.success).to.be.eql(true);
            expect(res.body.message).to.be.eql('Area deleted');
            done();
          });
      });
    });

    context('when user token is used', () => {
      it('returns forbidden', (done) => {
        request()
          .delete(`/api/v1/area/delete/${areaId}`)
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
          .delete(`/api/v1/area/delete/${areaId}`)
          .end((err, res) => {
            expect(res).to.have.status(403);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Token needed to access resources');
            done();
          });
      });
    });

    context('when delete area service returns an error', () => {
      it('returns the error', (done) => {
        sinon.stub(Area, 'findByIdAndDelete').throws(new Error('Type Error'));
        request()
          .delete(`/api/v1/area/delete/${areaId}`)
          .set('authorization', editorToken)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.success).to.be.eql(false);
            done();
            Area.findByIdAndDelete.restore();
          });
      });
    });

    context('when area is assigned to a content property', () => {
      const contentProperty = ContentPropertyFactory.build({ areaId });
      beforeEach(async () => {
        await addContentProperty(contentProperty);
      });

      it('deletes area', (done) => {
        request()
          .delete(`/api/v1/area/delete/${areaId}`)
          .set('authorization', editorToken)
          .end((err, res) => {
            expect(res).to.have.status(412);
            expect(res.body.success).to.be.eql(false);
            expect(res.body.message).to.be.eql('Area is linked to 1 content property');
            done();
          });
      });
    });

    context('with invalid id supplied', () => {
      const invalidId = mongoose.Types.ObjectId();
      context('when area id is invalid', () => {
        it('returns an error', (done) => {
          request()
            .delete(`/api/v1/area/delete/${invalidId}`)
            .set('authorization', editorToken)
            .end((err, res) => {
              expect(res).to.have.status(404);
              expect(res.body.success).to.be.eql(false);
              expect(res.body.message).to.be.eql('Area not found');
              done();
            });
        });
      });
    });
  });
});
