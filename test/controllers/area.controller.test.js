import { expect, request, useDatabase } from '../config';
import AreaFactory from '../factories/area.factory';
import UserFactory from '../factories/user.factory';
import { addUser } from '../../server/services/user.service';
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
      beforeEach(async () => {
        adminToken = await addUser(admin);
      });

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
      beforeEach(async () => {
        userToken = await addUser(user);
      });

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
});
