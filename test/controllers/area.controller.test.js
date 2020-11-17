import { expect, request, useDatabase, sinon } from '../config';
import Area from '../../server/models/area.model';
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
});
